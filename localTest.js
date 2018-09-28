/**
 * Author : @yangjs
 * Date 2018.02.28
 */

const fs = require("fs");

// 사용자 모듈 로드
const index = require('./index');

const event = JSON.parse(fs.readFileSync("test_event/event.json"));
console.log(`===== event: ${JSON.stringify(event)}`);

index.handler(event, null, e => {
    console.log(`===== result: ${e}`);
});
