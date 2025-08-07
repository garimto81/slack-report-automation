const fs = require('fs');

// 원본 키 읽기
const keyContent = fs.readFileSync('service-account-key.json', 'utf8');
const keyFile = JSON.parse(keyContent);

// private_key의 \\n을 실제 개행으로 변환
if (keyFile.private_key) {
    // 이미 이스케이프된 \\n을 실제 개행으로 변환
    keyFile.private_key = keyFile.private_key.split('\\n').join('\n');
}

// 수정된 키를 파일로 저장
fs.writeFileSync('service-account-key-fixed.json', JSON.stringify(keyFile, null, 2));

console.log('✅ 키 파일 수정 완료');
console.log('개행 문자 개수:', (keyFile.private_key.match(/\n/g) || []).length);