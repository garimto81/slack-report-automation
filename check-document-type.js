#!/usr/bin/env node

/**
 * Google Drive API를 통해 문서 타입과 구조 확인
 */

const { google } = require('googleapis');

async function checkDocumentType() {
    console.log('🔍 문서 타입 및 구조 확인');
    console.log('=' .repeat(60));
    
    try {
        // 1. 인증 설정
        const auth = new google.auth.GoogleAuth({
            keyFile: 'service-account-key-fixed.json',
            scopes: [
                'https://www.googleapis.com/auth/drive.readonly',
                'https://www.googleapis.com/auth/documents',
                'https://www.googleapis.com/auth/spreadsheets.readonly'
            ]
        });
        
        const client = await auth.getClient();
        console.log('✅ 인증 성공\n');
        
        // 2. Drive API로 파일 정보 가져오기
        const drive = google.drive({ version: 'v3', auth: client });
        const fileId = '1QvLn7yJJ1c3xtwF8bd4lK_k6FL4hmcT5TiGvoeGRPow';
        
        console.log('📄 파일 정보 조회 중...\n');
        
        try {
            const fileResponse = await drive.files.get({
                fileId: fileId,
                fields: 'id,name,mimeType,kind,size,createdTime,modifiedTime,owners,lastModifyingUser,capabilities'
            });
            
            const file = fileResponse.data;
            
            console.log('📌 파일 기본 정보:');
            console.log('─'.repeat(40));
            console.log(`파일명: ${file.name}`);
            console.log(`파일 ID: ${file.id}`);
            console.log(`MIME 타입: ${file.mimeType}`);
            console.log(`종류: ${file.kind}`);
            console.log(`크기: ${file.size ? (parseInt(file.size) / 1024).toFixed(2) + ' KB' : 'N/A'}`);
            console.log(`생성일: ${file.createdTime}`);
            console.log(`수정일: ${file.modifiedTime}`);
            
            if (file.owners && file.owners.length > 0) {
                console.log(`소유자: ${file.owners[0].displayName || file.owners[0].emailAddress}`);
            }
            
            if (file.lastModifyingUser) {
                console.log(`마지막 수정자: ${file.lastModifyingUser.displayName || file.lastModifyingUser.emailAddress}`);
            }
            
            console.log('');
            
            // MIME 타입 분석
            console.log('📊 문서 타입 분석:');
            console.log('─'.repeat(40));
            
            if (file.mimeType === 'application/vnd.google-apps.document') {
                console.log('✅ Google Docs 문서입니다.');
                
                // Docs API v1으로 다시 시도
                const docs = google.docs({ version: 'v1', auth: client });
                
                // includeTabsContent 파라미터 추가
                console.log('\n🔍 탭 컨텐츠 포함하여 다시 조회...\n');
                
                const docResponse = await docs.documents.get({
                    documentId: fileId
                });
                
                const doc = docResponse.data;
                
                // 탭 확인
                if (doc.tabs) {
                    console.log(`📑 탭이 있는 문서입니다!`);
                    console.log(`탭 개수: ${doc.tabs.length}개\n`);
                    
                    doc.tabs.forEach((tab, index) => {
                        console.log(`탭 ${index + 1}:`);
                        if (tab.tabProperties) {
                            console.log(`  제목: "${tab.tabProperties.title || '제목 없음'}"`);
                            console.log(`  탭 ID: ${tab.tabProperties.tabId}`);
                        }
                    });
                } else {
                    console.log('📄 단일 문서 (탭 없음)');
                    
                    // 페이지 수 추정
                    if (doc.body && doc.body.content) {
                        let pageBreaks = 0;
                        let sectionBreaks = 0;
                        
                        doc.body.content.forEach(element => {
                            if (element.pageBreak) pageBreaks++;
                            if (element.sectionBreak) {
                                sectionBreaks++;
                                const sectionType = element.sectionBreak.sectionStyle?.sectionType;
                                if (sectionType === 'NEXT_PAGE') {
                                    pageBreaks++;
                                }
                            }
                        });
                        
                        console.log(`\n페이지 구분:`);
                        console.log(`  페이지 브레이크: ${pageBreaks}개`);
                        console.log(`  섹션 브레이크: ${sectionBreaks}개`);
                        console.log(`  예상 페이지 수: ${pageBreaks + 1}개`);
                    }
                }
                
            } else if (file.mimeType === 'application/vnd.google-apps.spreadsheet') {
                console.log('📊 Google Sheets 스프레드시트입니다!');
                
                // Sheets API로 시트 정보 가져오기
                const sheets = google.sheets({ version: 'v4', auth: client });
                
                const spreadsheet = await sheets.spreadsheets.get({
                    spreadsheetId: fileId
                });
                
                console.log(`\n시트 개수: ${spreadsheet.data.sheets.length}개\n`);
                
                spreadsheet.data.sheets.forEach((sheet, index) => {
                    console.log(`시트 ${index + 1}: "${sheet.properties.title}"`);
                    console.log(`  ID: ${sheet.properties.sheetId}`);
                    console.log(`  크기: ${sheet.properties.gridProperties.rowCount}행 × ${sheet.properties.gridProperties.columnCount}열`);
                });
                
            } else {
                console.log(`❓ 알 수 없는 타입: ${file.mimeType}`);
            }
            
            // 권한 확인
            if (file.capabilities) {
                console.log('\n📋 권한 정보:');
                console.log('─'.repeat(40));
                console.log(`읽기: ${file.capabilities.canRead ? '✅' : '❌'}`);
                console.log(`편집: ${file.capabilities.canEdit ? '✅' : '❌'}`);
                console.log(`댓글: ${file.capabilities.canComment ? '✅' : '❌'}`);
                console.log(`공유: ${file.capabilities.canShare ? '✅' : '❌'}`);
            }
            
        } catch (driveError) {
            console.error('Drive API 오류:', driveError.message);
            
            if (driveError.code === 404) {
                console.log('\n❌ 파일을 찾을 수 없습니다.');
                console.log('파일 ID를 확인하거나 파일이 공유되어 있는지 확인해주세요.');
            }
        }
        
        console.log('\n✅ 확인 완료!');
        
    } catch (error) {
        console.error('\n❌ 확인 실패');
        console.error('오류:', error.message);
    }
}

// 메인 실행
if (require.main === module) {
    checkDocumentType().catch(console.error);
}

module.exports = { checkDocumentType };