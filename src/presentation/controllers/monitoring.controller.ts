// src/presentation/controllers/monitoring.controller.ts
import { Controller, Get, Query, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import { MetricsService } from '../../common/services/metrics.service';
import { SuccessResponseDto } from '../../common/dto/api-response.dto';

@ApiTags('Monitoring')
@Controller('monitoring')
export class MonitoringController {
    constructor(private readonly metricsService: MetricsService) {}

    @Get('dashboard')
    @ApiOperation({ summary: '성능 모니터링 대시보드 HTML' })
    getDashboard(@Res() res: Response) {
        const html = `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HaruKok-BE 성능 모니터링</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #f5f5f5;
            padding: 20px;
        }
        .container { max-width: 1200px; margin: 0 auto; }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 20px;
            text-align: center;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .stat-card {
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            text-align: center;
        }
        .stat-value {
            font-size: 2em;
            font-weight: bold;
            color: #667eea;
            margin: 10px 0;
        }
        .stat-label {
            color: #666;
            font-size: 0.9em;
        }
        .chart-container {
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            margin-bottom: 20px;
        }
        .chart-title {
            font-size: 1.2em;
            font-weight: bold;
            margin-bottom: 15px;
            color: #333;
        }
        .refresh-btn {
            background: #667eea;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 1em;
            margin: 10px;
        }
        .refresh-btn:hover {
            background: #5a67d8;
        }
        .table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }
        .table th, .table td {
            padding: 10px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        .table th {
            background-color: #f8f9fa;
            font-weight: bold;
        }
        .status-indicator {
            display: inline-block;
            width: 10px;
            height: 10px;
            border-radius: 50%;
            margin-right: 5px;
        }
        .status-ok { background-color: #28a745; }
        .status-warning { background-color: #ffc107; }
        .status-error { background-color: #dc3545; }
        .auto-refresh {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 10px 15px;
            border-radius: 20px;
            font-size: 0.9em;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 HaruKok-BE 성능 모니터링 대시보드</h1>
            <p>실시간 서버 성능 및 API 모니터링</p>
        </div>

        <div style="text-align: center; margin-bottom: 20px;">
            <button class="refresh-btn" onclick="refreshData()">🔄 새로고침</button>
            <button class="refresh-btn" onclick="toggleAutoRefresh()" id="autoRefreshBtn">⏸️ 자동 새로고침</button>
        </div>

        <div class="stats-grid" id="statsGrid">
            <!-- 통계 카드들이 여기에 동적으로 추가됩니다 -->
        </div>

        <div class="chart-container">
            <div class="chart-title">📊 응답 시간 추이</div>
            <canvas id="responseTimeChart" width="400" height="100"></canvas>
        </div>

        <div class="chart-container">
            <div class="chart-title">💾 시스템 리소스</div>
            <canvas id="systemChart" width="400" height="100"></canvas>
        </div>

        <div class="chart-container">
            <div class="chart-title">🎯 엔드포인트별 성능</div>
            <table class="table" id="endpointTable">
                <thead>
                    <tr>
                        <th>엔드포인트</th>
                        <th>요청 수</th>
                        <th>평균 응답시간</th>
                        <th>에러율</th>
                        <th>상태</th>
                    </tr>
                </thead>
                <tbody id="endpointTableBody">
                </tbody>
            </table>
        </div>

        <div class="chart-container">
            <div class="chart-title">📝 최근 API 호출</div>
            <table class="table" id="recentCallsTable">
                <thead>
                    <tr>
                        <th>시간</th>
                        <th>메서드</th>
                        <th>URL</th>
                        <th>응답시간</th>
                        <th>상태코드</th>
                    </tr>
                </thead>
                <tbody id="recentCallsTableBody">
                </tbody>
            </table>
        </div>
    </div>

    <div class="auto-refresh" id="autoRefreshStatus">
        자동 새로고침: 활성화 (5초마다)
    </div>

    <script>
        let autoRefreshInterval;
        let autoRefreshEnabled = true;
        let responseTimeChart;
        let systemChart;

        // 초기 데이터 로드
        refreshData();
        startAutoRefresh();

        async function refreshData() {
            try {
                const [stats, system, endpoints, recentCalls] = await Promise.all([
                    fetch('/monitoring/stats').then(r => r.json()),
                    fetch('/monitoring/system').then(r => r.json()),
                    fetch('/monitoring/endpoints').then(r => r.json()),
                    fetch('/monitoring/recent-calls').then(r => r.json())
                ]);

                updateStatsCards(stats.data);
                updateSystemChart(system.data);
                updateEndpointTable(endpoints.data);
                updateRecentCallsTable(recentCalls.data);

            } catch (error) {
                console.error('데이터 로드 실패:', error);
            }
        }

        function updateStatsCards(stats) {
            const statsGrid = document.getElementById('statsGrid');
            statsGrid.innerHTML = \`
                <div class="stat-card">
                    <div class="stat-value">\${stats.totalRequests}</div>
                    <div class="stat-label">총 요청 수 (5분)</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">\${stats.averageResponseTime}ms</div>
                    <div class="stat-label">평균 응답시간</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">\${stats.errorRate}%</div>
                    <div class="stat-label">에러율</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">\${stats.requestsPerMinute}</div>
                    <div class="stat-label">분당 요청 수</div>
                </div>
            \`;
        }

        function updateSystemChart(system) {
            const ctx = document.getElementById('systemChart').getContext('2d');
            
            if (systemChart) {
                systemChart.destroy();
            }

            systemChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['사용된 메모리', '여유 메모리'],
                    datasets: [{
                        data: [system.memory.usagePercent, 100 - system.memory.usagePercent],
                        backgroundColor: ['#ff6384', '#36a2eb'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        title: {
                            display: true,
                            text: \`메모리 사용률: \${system.memory.usagePercent.toFixed(1)}% | CPU: \${system.cpu.usage}%\`
                        }
                    }
                }
            });
        }

        function updateEndpointTable(endpoints) {
            const tbody = document.getElementById('endpointTableBody');
            tbody.innerHTML = endpoints.map(ep => {
                const status = ep.errorRate > 10 ? 'error' : ep.averageTime > 1000 ? 'warning' : 'ok';
                return \`
                    <tr>
                        <td>\${ep.endpoint}</td>
                        <td>\${ep.count}</td>
                        <td>\${ep.averageTime}ms</td>
                        <td>\${ep.errorRate}%</td>
                        <td><span class="status-indicator status-\${status}"></span>\${status.toUpperCase()}</td>
                    </tr>
                \`;
            }).join('');
        }

        function updateRecentCallsTable(calls) {
            const tbody = document.getElementById('recentCallsTableBody');
            tbody.innerHTML = calls.slice(0, 20).map(call => {
                const time = new Date(call.timestamp).toLocaleTimeString();
                const statusClass = call.statusCode >= 400 ? 'status-error' : call.responseTime > 1000 ? 'status-warning' : 'status-ok';
                return \`
                    <tr>
                        <td>\${time}</td>
                        <td>\${call.method}</td>
                        <td>\${call.url}</td>
                        <td>\${call.responseTime}ms</td>
                        <td><span class="status-indicator \${statusClass}"></span>\${call.statusCode}</td>
                    </tr>
                \`;
            }).join('');
        }

        function startAutoRefresh() {
            if (autoRefreshInterval) {
                clearInterval(autoRefreshInterval);
            }
            autoRefreshInterval = setInterval(refreshData, 5000);
        }

        function toggleAutoRefresh() {
            const btn = document.getElementById('autoRefreshBtn');
            const status = document.getElementById('autoRefreshStatus');
            
            if (autoRefreshEnabled) {
                clearInterval(autoRefreshInterval);
                btn.textContent = '▶️ 자동 새로고침';
                status.textContent = '자동 새로고침: 비활성화';
                autoRefreshEnabled = false;
            } else {
                startAutoRefresh();
                btn.textContent = '⏸️ 자동 새로고침';
                status.textContent = '자동 새로고침: 활성화 (5초마다)';
                autoRefreshEnabled = true;
            }
        }
    </script>
</body>
</html>
        `;

        res.setHeader('Content-Type', 'text/html');
        res.send(html);
    }

    @Get('stats')
    @ApiOperation({ summary: '성능 통계 조회' })
    @ApiQuery({
        name: 'timeWindow',
        required: false,
        type: Number,
        description: '시간 윈도우(분)',
        example: 5,
    })
    @ApiResponse({ status: 200, description: '성능 통계 조회 성공' })
    async getPerformanceStats(
        @Query('timeWindow') timeWindow?: number,
    ): Promise<SuccessResponseDto<any>> {
        const stats = this.metricsService.getPerformanceStats(timeWindow || 5);
        return {
            success: true,
            statusCode: 200,
            code: 'SUCCESS',
            message: '성능 통계 조회 성공',
            data: stats,
        };
    }

    @Get('system')
    @ApiOperation({ summary: '시스템 메트릭 조회' })
    @ApiResponse({ status: 200, description: '시스템 메트릭 조회 성공' })
    async getSystemMetrics(): Promise<SuccessResponseDto<any>> {
        const metrics = this.metricsService.getSystemMetrics();
        return {
            success: true,
            statusCode: 200,
            code: 'SUCCESS',
            message: '시스템 메트릭 조회 성공',
            data: metrics,
        };
    }

    @Get('endpoints')
    @ApiOperation({ summary: '엔드포인트별 성능 통계' })
    @ApiResponse({ status: 200, description: '엔드포인트 통계 조회 성공' })
    async getEndpointStats(): Promise<SuccessResponseDto<any>> {
        const stats = this.metricsService.getEndpointStats();
        return {
            success: true,
            statusCode: 200,
            code: 'SUCCESS',
            message: '엔드포인트 통계 조회 성공',
            data: stats,
        };
    }

    @Get('recent-calls')
    @ApiOperation({ summary: '최근 API 호출 기록' })
    @ApiQuery({
        name: 'limit',
        required: false,
        type: Number,
        description: '조회할 기록 수',
        example: 50,
    })
    @ApiResponse({ status: 200, description: '최근 호출 기록 조회 성공' })
    async getRecentApiCalls(@Query('limit') limit?: number): Promise<SuccessResponseDto<any>> {
        const calls = this.metricsService.getRecentApiCalls(limit || 50);
        return {
            success: true,
            statusCode: 200,
            code: 'SUCCESS',
            message: '최근 호출 기록 조회 성공',
            data: calls,
        };
    }

    @Get('health')
    @ApiOperation({ summary: '애플리케이션 헬스체크' })
    @ApiResponse({ status: 200, description: '헬스체크 성공' })
    async getHealthCheck(): Promise<SuccessResponseDto<any>> {
        const appInfo = this.metricsService.getApplicationInfo();
        const systemMetrics = this.metricsService.getSystemMetrics();

        const healthStatus = {
            status: 'healthy',
            timestamp: new Date(),
            application: appInfo,
            system: {
                memoryUsage: systemMetrics.memory.usagePercent,
                uptime: systemMetrics.uptime,
                cpuUsage: systemMetrics.cpu.usage,
            },
        };

        return {
            success: true,
            statusCode: 200,
            code: 'SUCCESS',
            message: '헬스체크 성공',
            data: healthStatus,
        };
    }

    @Get('clear-metrics')
    @ApiOperation({ summary: '메트릭 데이터 초기화' })
    @ApiResponse({ status: 200, description: '메트릭 데이터 초기화 성공' })
    async clearMetrics(): Promise<SuccessResponseDto<any>> {
        this.metricsService.clearMetrics();

        return {
            success: true,
            statusCode: 200,
            code: 'SUCCESS',
            message: '메트릭 데이터가 성공적으로 초기화되었습니다',
            data: {
                clearedAt: new Date(),
                message: '모든 API 호출 기록이 삭제되었습니다',
            },
        };
    }
}
