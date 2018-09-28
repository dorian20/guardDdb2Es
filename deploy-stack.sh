#!/bin/bash

#./deploy-stack.sh GUARD-DETECT-DDB-2-ES_elltdev.yaml elltdev.lambda.lotte.net GUARD-DETECT-DDB-2-ES-STACK l-ellotte-dev

if [ "$#" -ne 4 ]; then
	echo "usage: deploy-stack.sh (deploy 파일명) (버킷명) (스택명) (프로파일명)"
	exit 0
fi

#cloudformation 배포하기 
#package
aws cloudformation package --template-file ./deploy/$1 --output-template-file serverless-output.yaml \
   --s3-bucket $2 --region ap-northeast-2 \
   --profile $4

#deploy
aws cloudformation deploy --template-file ./serverless-output.yaml \
   --stack-name $3 --region ap-northeast-2 \
   --profile $4
