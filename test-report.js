"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv = __importStar(require("dotenv"));
const slack_service_1 = require("./src/services/slack.service");
const gemini_service_1 = require("./src/services/gemini.service");
dotenv.config();
async function testReport() {
    console.log('Starting test report generation...\n');
    // Validate required environment variables
    const requiredVars = ['SLACK_BOT_TOKEN', 'SLACK_CHANNEL_ID', 'SLACK_DM_USER_ID', 'GEMINI_API_KEY'];
    const missingVars = requiredVars.filter(v => !process.env[v]);
    if (missingVars.length > 0) {
        console.error('Missing environment variables:', missingVars);
        return;
    }
    try {
        // Initialize services
        const slackService = new slack_service_1.SlackService(process.env.SLACK_BOT_TOKEN);
        const geminiService = new gemini_service_1.GeminiService(process.env.GEMINI_API_KEY);
        // Get messages from the last 24 hours
        const since = new Date();
        since.setHours(since.getHours() - 24);
        console.log(`Fetching messages from channel ${process.env.SLACK_CHANNEL_ID} since ${since.toISOString()}...`);
        const messages = await slackService.getChannelMessages(process.env.SLACK_CHANNEL_ID, since);
        console.log(`Found ${messages.length} messages\n`);
        if (messages.length === 0) {
            console.log('No messages found in the specified time range.');
            console.log('Sending test message to verify DM functionality...');
            await slackService.sendDirectMessage(process.env.SLACK_DM_USER_ID, '🧪 *Test Report*\\n\\nNo messages found in the channel for analysis. This is a test message to verify the bot can send DMs.');
            console.log('Test message sent successfully!');
            return;
        }
        // Analyze messages with Gemini
        console.log('Analyzing messages with Gemini AI...');
        const analysis = await geminiService.analyzeMessages(messages, 'daily');
        // Format report
        let report = `🧪 *Test Daily Report*\n\n`;
        report += `📊 Channel: <#${process.env.SLACK_CHANNEL_ID}>\n`;
        report += `📅 Period: Last 24 hours\n`;
        report += `📨 Total messages: ${analysis.totalMessages}\n`;
        report += `👥 Active users: ${analysis.activeUsers.length}\n\n`;
        if (analysis.summary) {
            report += `*AI Summary:*\n${analysis.summary}\n\n`;
        }
        if (analysis.topContributors && analysis.topContributors.length > 0) {
            report += `*Top Contributors:*\n`;
            analysis.topContributors.slice(0, 3).forEach((c, i) => {
                report += `${i + 1}. <@${c.user}> - ${c.messageCount} messages`;
                if (c.contribution)
                    report += ` (${c.contribution})`;
                report += '\n';
            });
        }
        // Send test report
        console.log('\nSending test report to user...');
        await slackService.sendDirectMessage(process.env.SLACK_DM_USER_ID, report);
        console.log('✅ Test report sent successfully!');
    }
    catch (error) {
        console.error('❌ Error during test:', error);
    }
}
// Run the test
testReport();
