/**
 * Slack API 래퍼 클래스
 */

const { WebClient } = require('@slack/web-api');

class SlackApi {
    constructor() {
        this.client = new WebClient(process.env.SLACK_BOT_TOKEN);
    }
    
    /**
     * 특정 날짜 범위의 메시지 수집
     * @param {string} channelId 채널 ID
     * @param {Date} startTime 시작 시간
     * @param {Date} endTime 종료 시간
     * @returns {Promise<Array>} 메시지 배열
     */
    async getMessages(channelId, startTime, endTime) {
        try {
            const startTimestamp = Math.floor(startTime.getTime() / 1000);
            const endTimestamp = Math.floor(endTime.getTime() / 1000);
            
            console.log(`📡 Slack 메시지 수집: ${startTime.toLocaleString('ko-KR')} ~ ${endTime.toLocaleString('ko-KR')}`);
            
            const result = await this.client.conversations.history({
                channel: channelId,
                oldest: startTimestamp.toString(),
                latest: endTimestamp.toString(),
                limit: 100
            });
            
            if (!result.ok) {
                throw new Error(`Slack API 오류: ${result.error}`);
            }
            
            const messages = result.messages || [];
            const filteredMessages = messages
                .filter(msg => msg.text && msg.text.trim() && !msg.bot_id) // 봇 메시지 제외
                .map(msg => ({
                    text: msg.text,
                    user: msg.user,
                    timestamp: new Date(parseFloat(msg.ts) * 1000),
                    channel: channelId
                }));
                
            console.log(`✅ ${filteredMessages.length}개 유효한 메시지 수집`);
            return filteredMessages;
            
        } catch (error) {
            console.error('❌ Slack 메시지 수집 오류:', error.message);
            throw error;
        }
    }
    
    /**
     * 채널 정보 가져오기
     * @param {string} channelId 채널 ID
     * @returns {Promise<Object>} 채널 정보
     */
    async getChannelInfo(channelId) {
        try {
            const result = await this.client.conversations.info({
                channel: channelId
            });
            
            if (!result.ok) {
                throw new Error(`채널 정보 조회 오류: ${result.error}`);
            }
            
            return result.channel;
        } catch (error) {
            console.error('❌ 채널 정보 조회 오류:', error.message);
            throw error;
        }
    }
    
    /**
     * API 연결 테스트
     * @returns {Promise<boolean>} 연결 성공 여부
     */
    async testConnection() {
        try {
            const result = await this.client.auth.test();
            
            if (result.ok) {
                console.log(`✅ Slack API 연결 성공: ${result.user} (${result.team})`);
                return true;
            } else {
                throw new Error(`인증 실패: ${result.error}`);
            }
        } catch (error) {
            console.error('❌ Slack API 연결 실패:', error.message);
            return false;
        }
    }
}

module.exports = { SlackApi };