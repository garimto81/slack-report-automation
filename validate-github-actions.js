#!/usr/bin/env node

/**
 * GitHub Actions 워크플로우 검증 도구
 */

const fs = require('fs');
const path = require('path');

function validateGitHubActions() {
    console.log('🔍 GitHub Actions 워크플로우 검증 시작');
    console.log('=' .repeat(60));
    
    const results = {
        passed: 0,
        failed: 0,
        warnings: 0,
        issues: []
    };
    
    // 1. 워크플로우 파일 존재 확인
    console.log('📄 1단계: 워크플로우 파일 검증');
    console.log('─'.repeat(40));
    
    const workflowPath = '.github/workflows/camera-auto-update.yml';
    
    if (!fs.existsSync(workflowPath)) {
        results.failed++;
        results.issues.push('❌ 워크플로우 파일이 존재하지 않음');
        console.log('❌ 워크플로우 파일 없음');
        return results;
    }
    
    console.log('✅ 워크플로우 파일 존재');
    results.passed++;
    
    // 2. 워크플로우 파일 구조 분석
    let workflowContent;
    try {
        workflowContent = fs.readFileSync(workflowPath, 'utf8');
        console.log(`✅ 워크플로우 파일 읽기 성공 (${workflowContent.length} 문자)`);
        results.passed++;
    } catch (error) {
        results.failed++;
        results.issues.push('❌ 워크플로우 파일 읽기 실패');
        console.log('❌ 파일 읽기 실패:', error.message);
        return results;
    }
    
    // 3. 필수 구성 요소 확인
    console.log('\n🔧 2단계: 워크플로우 구성 요소 검증');
    console.log('─'.repeat(40));
    
    const requiredElements = [
        { name: '이름 (name)', pattern: /^name:/, found: false },
        { name: '트리거 (on)', pattern: /^on:/, found: false },
        { name: '스케줄 (schedule)', pattern: /schedule:/, found: false },
        { name: '크론 표현식', pattern: /cron:.*'0 1 \* \* 1-5'/, found: false },
        { name: '수동 실행 (workflow_dispatch)', pattern: /workflow_dispatch:/, found: false },
        { name: '작업 (jobs)', pattern: /^jobs:/, found: false },
        { name: 'Ubuntu 러너', pattern: /runs-on: ubuntu-latest/, found: false },
        { name: '체크아웃', pattern: /uses: actions\/checkout@v4/, found: false },
        { name: 'Node.js 설정', pattern: /uses: actions\/setup-node@v4/, found: false },
        { name: '의존성 설치', pattern: /npm install/, found: false },
        { name: '메인 스크립트 실행', pattern: /node automated-camera-update\.js/, found: false }
    ];
    
    const lines = workflowContent.split('\n');
    lines.forEach(line => {
        requiredElements.forEach(element => {
            if (element.pattern.test(line.trim())) {
                element.found = true;
            }
        });
    });
    
    requiredElements.forEach(element => {
        if (element.found) {
            console.log(`✅ ${element.name}`);
            results.passed++;
        } else {
            console.log(`❌ ${element.name} - 누락`);
            results.failed++;
            results.issues.push(`❌ ${element.name} 누락`);
        }
    });
    
    // 4. 환경변수 및 시크릿 확인
    console.log('\n🔐 3단계: 시크릿 및 환경변수 검증');
    console.log('─'.repeat(40));
    
    const requiredSecrets = [
        'SLACK_BOT_TOKEN',
        'SLACK_CHANNEL_ID',
        'GOOGLE_SERVICE_ACCOUNT_KEY',
        'GOOGLE_DOCS_ID',
        'GEMINI_API_KEY'
    ];
    
    requiredSecrets.forEach(secret => {
        const pattern = new RegExp(`\\$\\{\\{\\s*secrets\\.${secret}\\s*\\}\\}`);
        if (pattern.test(workflowContent)) {
            console.log(`✅ ${secret} 시크릿 참조`);
            results.passed++;
        } else {
            console.log(`❌ ${secret} 시크릿 참조 누락`);
            results.failed++;
            results.issues.push(`❌ ${secret} 시크릿 누락`);
        }
    });
    
    // 5. 파일 경로 및 의존성 확인
    console.log('\n📁 4단계: 파일 및 의존성 검증');
    console.log('─'.repeat(40));
    
    const requiredFiles = [
        { path: 'automated-camera-update.js', description: '메인 자동화 스크립트' },
        { path: 'slack-api.js', description: 'Slack API 모듈' },
        { path: 'package.json', description: 'Node.js 패키지 설정' },
        { path: 'top-tasks-processor.js', description: 'AI 업무 처리 모듈' }
    ];
    
    requiredFiles.forEach(file => {
        if (fs.existsSync(file.path)) {
            console.log(`✅ ${file.description} (${file.path})`);
            results.passed++;
        } else {
            console.log(`❌ ${file.description} (${file.path}) - 파일 없음`);
            results.failed++;
            results.issues.push(`❌ ${file.path} 파일 누락`);
        }
    });
    
    // 6. package.json 의존성 확인
    if (fs.existsSync('package.json')) {
        try {
            const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
            
            console.log('\n📦 Node.js 의존성 확인:');
            
            const requiredDeps = [
                'googleapis',
                '@slack/web-api',
                '@google/generative-ai',
                'dotenv'
            ];
            
            requiredDeps.forEach(dep => {
                if (packageJson.dependencies && packageJson.dependencies[dep]) {
                    console.log(`✅ ${dep}: ${packageJson.dependencies[dep]}`);
                    results.passed++;
                } else {
                    console.log(`❌ ${dep} - 의존성 누락`);
                    results.failed++;
                    results.issues.push(`❌ ${dep} 의존성 누락`);
                }
            });
            
        } catch (error) {
            console.log('⚠️ package.json 파싱 실패');
            results.warnings++;
        }
    }
    
    // 7. 스케줄 설정 분석
    console.log('\n⏰ 5단계: 스케줄 설정 분석');
    console.log('─'.repeat(40));
    
    const cronMatch = workflowContent.match(/cron:\s*'([^']+)'/);
    if (cronMatch) {
        const cronExpression = cronMatch[1];
        console.log(`✅ 크론 표현식: "${cronExpression}"`);
        
        if (cronExpression === '0 1 * * 1-5') {
            console.log('✅ 올바른 스케줄: 평일 오전 10시 (한국시간)');
            console.log('  - UTC 01:00 = KST 10:00');
            console.log('  - 월~금요일 실행');
            console.log('  - 주말 제외');
            results.passed++;
        } else {
            console.log('⚠️ 예상과 다른 스케줄 설정');
            results.warnings++;
        }
        
        // 다음 실행 예정 시간 계산
        const now = new Date();
        const koreaTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
        
        console.log(`현재 한국 시간: ${koreaTime.toLocaleString('ko-KR')}`);
        
        // 다음 평일 오전 10시 계산
        const nextRun = new Date(koreaTime);
        nextRun.setHours(10, 0, 0, 0);
        
        if (nextRun <= koreaTime || nextRun.getDay() === 0 || nextRun.getDay() === 6) {
            // 다음 평일로 이동
            do {
                nextRun.setDate(nextRun.getDate() + 1);
            } while (nextRun.getDay() === 0 || nextRun.getDay() === 6);
        }
        
        console.log(`다음 실행 예정: ${nextRun.toLocaleString('ko-KR')}`);
        
    } else {
        console.log('❌ 크론 표현식을 찾을 수 없음');
        results.failed++;
    }
    
    // 8. 보안 및 모범 사례 검증
    console.log('\n🔒 6단계: 보안 및 모범 사례 검증');
    console.log('─'.repeat(40));
    
    // 하드코딩된 시크릿 확인
    const securityChecks = [
        {
            name: '하드코딩된 토큰 없음',
            pattern: /xoxb-[0-9]+-[0-9]+-[a-zA-Z0-9]+/,
            shouldNotMatch: true
        },
        {
            name: 'API 키 하드코딩 없음',
            pattern: /AIza[0-9A-Za-z-_]{35}/,
            shouldNotMatch: true
        },
        {
            name: '타임존 설정',
            pattern: /TZ:\s*['"]Asia\/Seoul['"]/,
            shouldNotMatch: false
        },
        {
            name: '실행 결과 로그',
            pattern: /GITHUB_STEP_SUMMARY/,
            shouldNotMatch: false
        }
    ];
    
    securityChecks.forEach(check => {
        const found = check.pattern.test(workflowContent);
        
        if (check.shouldNotMatch) {
            if (!found) {
                console.log(`✅ ${check.name}`);
                results.passed++;
            } else {
                console.log(`❌ ${check.name} - 보안 위험`);
                results.failed++;
                results.issues.push(`❌ ${check.name} 위반`);
            }
        } else {
            if (found) {
                console.log(`✅ ${check.name}`);
                results.passed++;
            } else {
                console.log(`⚠️ ${check.name} - 권장사항`);
                results.warnings++;
            }
        }
    });
    
    return results;
}

function generateValidationReport(results) {
    console.log('\n📊 검증 결과 요약');
    console.log('=' .repeat(60));
    
    console.log(`✅ 통과: ${results.passed}개`);
    console.log(`❌ 실패: ${results.failed}개`);
    console.log(`⚠️ 경고: ${results.warnings}개`);
    
    const total = results.passed + results.failed + results.warnings;
    const successRate = total > 0 ? ((results.passed / total) * 100).toFixed(1) : 0;
    
    console.log(`📈 성공률: ${successRate}%`);
    
    if (results.issues.length > 0) {
        console.log('\n🚨 해결 필요한 문제들:');
        results.issues.forEach((issue, index) => {
            console.log(`${index + 1}. ${issue}`);
        });
    }
    
    console.log('\n💡 다음 단계:');
    if (results.failed === 0) {
        console.log('✅ GitHub Actions 워크플로우가 올바르게 구성됨');
        console.log('📋 권장 작업:');
        console.log('  1. Repository secrets 설정 확인');
        console.log('  2. 수동 실행 테스트 진행');
        console.log('  3. 스케줄 작동 모니터링');
    } else {
        console.log('❌ 문제 해결 후 재검증 필요');
        console.log('🔧 수정 후 다음 명령으로 재검증:');
        console.log('  node validate-github-actions.js');
    }
    
    return results;
}

// 실행
if (require.main === module) {
    try {
        const results = validateGitHubActions();
        generateValidationReport(results);
        
        // 종료 코드 설정
        process.exit(results.failed > 0 ? 1 : 0);
        
    } catch (error) {
        console.error('❌ 검증 도구 오류:', error.message);
        process.exit(1);
    }
}

module.exports = { validateGitHubActions, generateValidationReport };