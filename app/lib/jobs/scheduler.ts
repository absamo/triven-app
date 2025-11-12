// T015: Background job scheduler with in-memory queue
type JobFunction = () => Promise<void>

interface JobConfig {
  name: string
  fn: JobFunction
  intervalMs: number
  enabled: boolean
}

class JobScheduler {
  private jobs: Map<string, JobConfig> = new Map()
  private intervals: Map<string, NodeJS.Timeout> = new Map()
  private isRunning = false

  /**
   * Register a job to be executed periodically
   */
  register(config: JobConfig): void {
    this.jobs.set(config.name, config)
    console.log(`[JobScheduler] Registered job: ${config.name} (interval: ${config.intervalMs}ms)`)
  }

  /**
   * Start all registered jobs that are enabled
   */
  start(): void {
    if (this.isRunning) {
      console.warn('[JobScheduler] Already running')
      return
    }

    this.isRunning = true
    console.log('[JobScheduler] Starting all enabled jobs')

    for (const [name, config] of this.jobs.entries()) {
      if (config.enabled) {
        this.startJob(name, config)
      } else {
        console.log(`[JobScheduler] Skipping disabled job: ${name}`)
      }
    }
  }

  /**
   * Start a specific job
   */
  private startJob(name: string, config: JobConfig): void {
    // Run immediately on start
    this.executeJob(name, config.fn)

    // Schedule periodic execution
    const intervalId = setInterval(() => {
      this.executeJob(name, config.fn)
    }, config.intervalMs)

    this.intervals.set(name, intervalId)
    console.log(`[JobScheduler] Started job: ${name}`)
  }

  /**
   * Execute a job with error handling
   */
  private async executeJob(name: string, fn: JobFunction): Promise<void> {
    console.log(`[JobScheduler] Executing job: ${name}`)
    const startTime = Date.now()

    try {
      await fn()
      const duration = Date.now() - startTime
      console.log(`[JobScheduler] Job ${name} completed in ${duration}ms`)
    } catch (error) {
      console.error(`[JobScheduler] Job ${name} failed:`, error)
      // Don't throw - keep the scheduler running
    }
  }

  /**
   * Stop all running jobs
   */
  stop(): void {
    if (!this.isRunning) {
      return
    }

    console.log('[JobScheduler] Stopping all jobs')

    for (const [name, intervalId] of this.intervals.entries()) {
      clearInterval(intervalId)
      console.log(`[JobScheduler] Stopped job: ${name}`)
    }

    this.intervals.clear()
    this.isRunning = false
  }

  /**
   * Stop a specific job
   */
  stopJob(name: string): void {
    const intervalId = this.intervals.get(name)
    if (intervalId) {
      clearInterval(intervalId)
      this.intervals.delete(name)
      console.log(`[JobScheduler] Stopped job: ${name}`)
    }
  }

  /**
   * Get status of all jobs
   */
  getStatus(): Array<{ name: string; enabled: boolean; running: boolean }> {
    return Array.from(this.jobs.entries()).map(([name, config]) => ({
      name,
      enabled: config.enabled,
      running: this.intervals.has(name),
    }))
  }
}

// Singleton instance
export const jobScheduler = new JobScheduler()

// Helper to check if jobs should run based on environment
export function shouldRunJobs(): boolean {
  // Run in production or if explicitly enabled
  return process.env.NODE_ENV === 'production' || process.env.ENABLE_JOBS === 'true'
}
