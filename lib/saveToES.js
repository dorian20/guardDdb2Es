/**
 * Author : @yangjs
 * Date 2018.06.29
 */

// 모듈 로드
const path = require('path');
const crypto = require('crypto');
const moment = require('moment-timezone');
const AWS = require('aws-sdk');
const parse = AWS.DynamoDB.Converter.output;
const log = require('./log');

// 현재 환경의 AWS Credentials 로드
const creds = new AWS.EnvironmentCredentials('AWS');

const saveToES = (event) => 
    new Promise((resolve, reject) => {
        for (let i = 0, len = event.Records.length; i < len; i++) {
            if (event.Records[i].eventName == 'INSERT' || event.Records[i].eventName == 'MODIFY') {
                send(event.Records[i].dynamodb.NewImage);
            }
        }
        
        return resolve();
    });


function hash(str, encoding) {
    return crypto.createHash('sha256')
        .update(str, 'utf8')
        .digest(encoding);
}

// ES 전송 function
function send(params) {
    log.debug(`params: ${JSON.stringify(params)}`);
    
    // Insert 하기 위한 data 생성
    let data = {};
    data = parse({'M': params });
    
    data.actionTime = moment(data.actionTime).subtract(9, 'h');     // 이미 KST로 넘어왔기 때문에 9시간을 빼준다
    data['@timestamp'] = data.actionTime;
    
    // Index명 구하기 
    const timestamp = moment(data['@timestamp']).tz('Asia/Seoul');
    
    // log.debug(`timestamp: ${timestamp}`);
    
    // 인덱스명 월 기준
    const index = [
        `guard-${timestamp.year()}`, // year
        (`0${(timestamp.month() + 1)}`).slice(-2), // month
    ].join('.');
    
    // log.debug(`index: ${JSON.stringify(index)}`);
    
    // Domain 정보
    const domain = {
        region: process.env.ES_REGION,
        endpoint: process.env.ES_ENDPOINT,
        index: index,
        type: 'doc'
    };
    
    // Endpoint 정보
    const endpoint = new AWS.Endpoint(domain.endpoint);
    
    // Endpoint에 대한 request 생성
    const req = new AWS.HttpRequest(endpoint);
    
    log.debug(`data: ${JSON.stringify(data)}`);
    const bData = Buffer.from(JSON.stringify(data));
    
    // log.debug(`bData: ${bData}`);
    
    // log.debug(path.join('/', domain.index, domain.type, data.id));
    
    // POST request
    req.method = 'POST';
    req.path = path.join('/', domain.index, domain.type, data.id);   // index, type, id
    req.region = domain.region;
    req.headers['presigned-expires'] = false;
    req.headers['Host'] = endpoint.host;
    req.headers['Content-Type'] = 'application/json';
    req.body = bData;
    
    log.debug(`req: ${JSON.stringify(req)}`);
    
    const signer = new AWS.Signers.V4(req, 'es'); // es: service code
    signer.addAuthorization(creds, new Date());
    
    const nodeHttpClient = new AWS.NodeHttpClient();
    
    nodeHttpClient.handleRequest(req, null, (res) => {
        let resBody = '';
        res.on('data', (chunk) => {
            resBody += chunk;
        });
        res.on('end', () => {
            log.debug(`response: ${resBody}`);
        });
    });
}

// 사용자 모듈 생성
module.exports = saveToES;
