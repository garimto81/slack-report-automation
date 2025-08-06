import { performance } from 'perf_hooks';

export interface TimeoutDiagnostics {
  phase: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  error?: Error;
  metadata?: Record<string, any>;
}

export class TimeoutTracker {
  private diagnostics: TimeoutDiagnostics[] = [];
  private currentPhase: TimeoutDiagnostics | null = null;
  private globalStartTime: number;
  private timeoutThresholds = {
    slackApi: 10000,      // 10초
    geminiApi: 20000,     // 20초
    supabase: 5000,       // 5초
    vercelTotal: 50000,   // 50초 (Pro plan)
    default: 30000        // 30초
  };

  constructor() {
    this.globalStartTime = performance.now();
  }

  startPhase(phaseName: string, metadata?: Record<string, any>): void {
    // 이전 phase 종료
    if (this.currentPhase && !this.currentPhase.endTime) {
      this.endPhase();
    }

    this.currentPhase = {
      phase: phaseName,
      startTime: performance.now(),
      metadata
    };
    
    console.log(`[PHASE START] ${phaseName} at ${this.getElapsedTime()}ms`);
    if (metadata) {
      console.log(`[METADATA] ${JSON.stringify(metadata)}`);
    }
  }

  endPhase(error?: Error): void {
    if (!this.currentPhase) return;

    this.currentPhase.endTime = performance.now();
    this.currentPhase.duration = this.currentPhase.endTime - this.currentPhase.startTime;
    
    if (error) {
      this.currentPhase.error = error;
    }

    // 임계값 체크
    const threshold = this.getThreshold(this.currentPhase.phase);
    const isTimeout = this.currentPhase.duration > threshold;

    console.log(`[PHASE END] ${this.currentPhase.phase} - Duration: ${this.currentPhase.duration.toFixed(2)}ms ${isTimeout ? '⚠️ TIMEOUT!' : '✅'}`);
    
    if (isTimeout) {
      console.error(`[TIMEOUT WARNING] ${this.currentPhase.phase} exceeded threshold (${this.currentPhase.duration.toFixed(2)}ms > ${threshold}ms)`);
    }

    this.diagnostics.push({ ...this.currentPhase });
    this.currentPhase = null;
  }

  addCheckpoint(name: string, data?: any): void {
    const elapsed = this.getElapsedTime();
    console.log(`[CHECKPOINT] ${name} at ${elapsed}ms`, data ? JSON.stringify(data) : '');
    
    // 전체 실행 시간 체크
    if (elapsed > this.timeoutThresholds.vercelTotal * 0.8) {
      console.warn(`[WARNING] Approaching Vercel timeout limit (${elapsed}ms / ${this.timeoutThresholds.vercelTotal}ms)`);
    }
  }

  private getThreshold(phase: string): number {
    const phaseKey = phase.toLowerCase();
    
    if (phaseKey.includes('slack')) return this.timeoutThresholds.slackApi;
    if (phaseKey.includes('gemini') || phaseKey.includes('ai')) return this.timeoutThresholds.geminiApi;
    if (phaseKey.includes('supabase') || phaseKey.includes('database')) return this.timeoutThresholds.supabase;
    
    return this.timeoutThresholds.default;
  }

  private getElapsedTime(): number {
    return performance.now() - this.globalStartTime;
  }

  getReport(): string {
    const totalDuration = this.getElapsedTime();
    const report: string[] = [
      '\n========== TIMEOUT DIAGNOSTICS REPORT ==========',
      `Total Execution Time: ${totalDuration.toFixed(2)}ms`,
      `Vercel Limit: ${this.timeoutThresholds.vercelTotal}ms`,
      `Status: ${totalDuration > this.timeoutThresholds.vercelTotal ? '❌ TIMEOUT' : '✅ OK'}`,
      '\n--- Phase Breakdown ---'
    ];

    // 각 phase 분석
    this.diagnostics.forEach((diag, index) => {
      const threshold = this.getThreshold(diag.phase);
      const status = diag.duration! > threshold ? '❌' : '✅';
      
      report.push(`\n${index + 1}. ${diag.phase} ${status}`);
      report.push(`   Duration: ${diag.duration?.toFixed(2)}ms / ${threshold}ms`);
      
      if (diag.metadata) {
        report.push(`   Metadata: ${JSON.stringify(diag.metadata)}`);
      }
      
      if (diag.error) {
        report.push(`   Error: ${diag.error.message}`);
      }
    });

    // 병목 구간 식별
    const bottlenecks = this.identifyBottlenecks();
    if (bottlenecks.length > 0) {
      report.push('\n--- Bottlenecks Identified ---');
      bottlenecks.forEach(b => {
        report.push(`⚠️  ${b.phase}: ${b.duration.toFixed(2)}ms (${b.percentage.toFixed(1)}% of total)`);
      });
    }

    // 권장사항
    report.push('\n--- Recommendations ---');
    report.push(...this.generateRecommendations());

    report.push('\n===============================================\n');
    
    return report.join('\n');
  }

  private identifyBottlenecks(): Array<{phase: string, duration: number, percentage: number}> {
    const totalDuration = this.getElapsedTime();
    
    return this.diagnostics
      .filter(d => d.duration)
      .map(d => ({
        phase: d.phase,
        duration: d.duration!,
        percentage: (d.duration! / totalDuration) * 100
      }))
      .filter(d => d.percentage > 20) // 전체 시간의 20% 이상 차지하는 phase
      .sort((a, b) => b.duration - a.duration);
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    const totalDuration = this.getElapsedTime();

    // Slack API 관련
    const slackPhases = this.diagnostics.filter(d => d.phase.toLowerCase().includes('slack'));
    const slackTotal = slackPhases.reduce((sum, d) => sum + (d.duration || 0), 0);
    
    if (slackTotal > 15000) {
      recommendations.push('• Slack API calls are taking too long. Consider:');
      recommendations.push('  - Reducing message fetch limit');
      recommendations.push('  - Implementing pagination');
      recommendations.push('  - Caching recent messages');
    }

    // Gemini API 관련
    const geminiPhases = this.diagnostics.filter(d => d.phase.toLowerCase().includes('gemini') || d.phase.toLowerCase().includes('ai'));
    const geminiTotal = geminiPhases.reduce((sum, d) => sum + (d.duration || 0), 0);
    
    if (geminiTotal > 20000) {
      recommendations.push('• Gemini AI processing is slow. Consider:');
      recommendations.push('  - Reducing prompt size');
      recommendations.push('  - Simplifying analysis requirements');
      recommendations.push('  - Using streaming responses');
    }

    // Thread 처리 관련
    const threadPhases = this.diagnostics.filter(d => d.phase.toLowerCase().includes('thread'));
    if (threadPhases.length > 10) {
      recommendations.push('• Too many thread operations. Consider:');
      recommendations.push('  - Batch processing threads');
      recommendations.push('  - Parallel thread fetching');
      recommendations.push('  - Limiting thread depth');
    }

    // Vercel 한계 관련
    if (totalDuration > this.timeoutThresholds.vercelTotal * 0.8) {
      recommendations.push('• Approaching Vercel timeout limit. Consider:');
      recommendations.push('  - Upgrading to Vercel Pro for 60s timeout');
      recommendations.push('  - Implementing background jobs');
      recommendations.push('  - Breaking into smaller operations');
    }

    return recommendations;
  }

  // 에러 정보 수집
  captureError(error: Error, context: Record<string, any>): void {
    console.error('[ERROR CAPTURED]', {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: this.getElapsedTime()
    });
  }
}

// 전역 timeout 감지기
export function createTimeoutHandler(tracker: TimeoutTracker, timeoutMs: number = 50000) {
  const timeoutId = setTimeout(() => {
    console.error('[GLOBAL TIMEOUT] Operation exceeded maximum time limit');
    console.log(tracker.getReport());
    process.exit(1);
  }, timeoutMs);

  return () => clearTimeout(timeoutId);
}