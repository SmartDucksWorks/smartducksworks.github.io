class ErrorLogger {
    constructor(appName = 'SmartDucks') {
        this.appName = appName;
        this.errors = [];
    }

    logError(error, context = {}) {
        const errorLog = {
            timestamp: new Date().toISOString(),
            error: error.message,
            stack: error.stack,
            context: {
                ...context,
                url: window.location.href,
                userAgent: navigator.userAgent
            }
        };
        
        this.errors.push(errorLog);
        this.sendToServer(errorLog);
    }

    async sendToServer(errorLog) {
        try {
            await fetch('https://duckpond.smartducks.works/api/log', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    app: this.appName,
                    error: errorLog
                })
            });
        } catch (e) {
            console.error('Failed to send error log:', e);
        }
    }
}
