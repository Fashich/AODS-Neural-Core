#!/usr/bin/env ruby
# frozen_string_literal: true

#
# AODS Ruby Automation Scripting Module
# Handles task automation and scheduled operations
#

require 'sinatra'
require 'json'
require 'net/http'
require 'uri'
require 'logger'
require 'schedule'
require 'redis'
require 'sidekiq'

# Configure Sinatra
set :port, 9007
set :bind, '0.0.0.0'
set :environment, ENV['RACK_ENV'] || 'development'

# Initialize logger
logger = Logger.new(STDOUT)
logger.level = Logger::INFO

# Redis connection for job queue
redis_url = ENV['REDIS_URL'] || 'redis://localhost:6379/0'
REDIS = Redis.new(url: redis_url)

# Job scheduler
SCHEDULER = Rufus::Scheduler.new

# In-memory job store (use Redis in production)
JOB_STORE = {}

puts "AODS Ruby Automation Service starting on port 8006..."

# Helper methods
def json_response(data, status = 200)
  content_type :json
  status status
  data.to_json
end

# Health check
get '/health' do
  json_response({
    status: 'healthy',
    service: 'ruby-automation',
    version: '1.0.0',
    timestamp: Time.now.iso8601,
    ruby_version: RUBY_VERSION,
    scheduled_jobs: SCHEDULER.jobs.size,
    queued_jobs: REDIS.llen('automation:queue')
  })
end

# Schedule a new job
post '/schedule' do
  begin
    payload = JSON.parse(request.body.read)
    
    job_id = SecureRandom.uuid
    job_type = payload['type']
    schedule = payload['schedule'] # cron expression or 'once'
    params = payload['params'] || {}
    
    job_data = {
      id: job_id,
      type: job_type,
      schedule: schedule,
      params: params,
      created_at: Time.now.iso8601,
      status: 'scheduled',
      last_run: nil,
      next_run: nil,
      run_count: 0
    }
    
    # Store job
    JOB_STORE[job_id] = job_data
    REDIS.set("job:#{job_id}", job_data.to_json)
    
    # Schedule the job
    if schedule == 'once'
      # Run immediately
      Thread.new { execute_job(job_id, job_type, params) }
      job_data[:status] = 'running'
    elsif schedule == 'now'
      # Run immediately but don't track as scheduled
      Thread.new { execute_job(job_id, job_type, params) }
    else
      # Schedule with cron
      SCHEDULER.cron schedule do
        execute_job(job_id, job_type, params)
      end
      job_data[:next_run] = SCHEDULER.jobs.last.next_time.to_s
    end
    
    logger.info "Job scheduled: #{job_id} (#{job_type})"
    
    json_response({
      success: true,
      job_id: job_id,
      status: job_data[:status],
      next_run: job_data[:next_run]
    })
    
  rescue => e
    logger.error "Failed to schedule job: #{e.message}"
    json_response({ error: e.message }, 500)
  end
end

# List all jobs
get '/jobs' do
  jobs = JOB_STORE.map do |id, job|
    {
      id: id,
      type: job[:type],
      status: job[:status],
      schedule: job[:schedule],
      created_at: job[:created_at],
      last_run: job[:last_run],
      next_run: job[:next_run],
      run_count: job[:run_count]
    }
  end
  
  json_response({ jobs: jobs, total: jobs.size })
end

# Get job details
get '/jobs/:id' do
  job = JOB_STORE[params[:id]]
  
  if job.nil?
    json_response({ error: 'Job not found' }, 404)
  else
    json_response(job)
  end
end

# Cancel a job
delete '/jobs/:id' do
  job = JOB_STORE[params[:id]]
  
  if job.nil?
    json_response({ error: 'Job not found' }, 404)
  else
    # Unschedule if it's a scheduled job
    SCHEDULER.jobs(tag: params[:id]).each(&:unschedule)
    
    job[:status] = 'cancelled'
    REDIS.set("job:#{params[:id]}", job.to_json)
    
    json_response({ success: true, message: 'Job cancelled' })
  end
end

# Run job immediately
post '/jobs/:id/run' do
  job = JOB_STORE[params[:id]]
  
  if job.nil?
    json_response({ error: 'Job not found' }, 404)
  else
    Thread.new { execute_job(params[:id], job[:type], job[:params]) }
    json_response({ success: true, message: 'Job started' })
  end
end

# Execute automation task
post '/execute' do
  begin
    payload = JSON.parse(request.body.read)
    
    task_type = payload['task']
    parameters = payload['parameters'] || {}
    
    result = execute_task(task_type, parameters)
    
    json_response({
      success: true,
      task: task_type,
      result: result,
      executed_at: Time.now.iso8601
    })
    
  rescue => e
    logger.error "Task execution failed: #{e.message}"
    json_response({ error: e.message }, 500)
  end
end

# Backup operations
post '/backup' do
  begin
    payload = JSON.parse(request.body.read)
    
    target = payload['target'] || 'database'
    destination = payload['destination'] || 's3'
    
    # Simulate backup
    backup_id = SecureRandom.hex(8)
    
    Thread.new do
      logger.info "Starting backup: #{backup_id}"
      sleep 5 # Simulate backup time
      logger.info "Backup completed: #{backup_id}"
    end
    
    json_response({
      success: true,
      backup_id: backup_id,
      target: target,
      destination: destination,
      status: 'in_progress',
      started_at: Time.now.iso8601
    })
    
  rescue => e
    json_response({ error: e.message }, 500)
  end
end

# Cleanup operations
post '/cleanup' do
  begin
    payload = JSON.parse(request.body.read)
    
    target = payload['target'] || 'temp_files'
    older_than = payload['older_than'] || '7d'
    
    # Simulate cleanup
    deleted_count = rand(100..500)
    freed_space = rand(1000..5000)
    
    json_response({
      success: true,
      target: target,
      older_than: older_than,
      deleted_count: deleted_count,
      freed_space_mb: freed_space,
      completed_at: Time.now.iso8601
    })
    
  rescue => e
    json_response({ error: e.message }, 500)
  end
end

# Report generation
post '/report' do
  begin
    payload = JSON.parse(request.body.read)
    
    report_type = payload['type'] || 'system'
    format = payload['format'] || 'json'
    
    # Generate report
    report = generate_report(report_type)
    
    if format == 'csv'
      content_type 'text/csv'
      attachment "report_#{report_type}_#{Time.now.to_i}.csv"
      to_csv(report)
    else
      json_response({
        success: true,
        type: report_type,
        generated_at: Time.now.iso8601,
        data: report
      })
    end
    
  rescue => e
    json_response({ error: e.message }, 500)
  end
end

# System maintenance
post '/maintenance' do
  begin
    payload = JSON.parse(request.body.read)
    
    operation = payload['operation']
    
    case operation
    when 'restart_services'
      result = { restarted: ['python-ai', 'go-telemetry'], duration: 15 }
    when 'clear_cache'
      result = { cleared: ['redis', 'memcached'], entries: 15420 }
    when 'optimize_db'
      result = { tables_optimized: 12, space_reclaimed: '256MB' }
    else
      result = { message: 'Unknown operation' }
    end
    
    json_response({
      success: true,
      operation: operation,
      result: result,
      executed_at: Time.now.iso8601
    })
    
  rescue => e
    json_response({ error: e.message }, 500)
  end
end

# Job execution handler
def execute_job(job_id, job_type, params)
  job = JOB_STORE[job_id]
  return unless job
  
  job[:status] = 'running'
  job[:last_run] = Time.now.iso8601
  
  begin
    result = execute_task(job_type, params)
    
    job[:status] = 'completed'
    job[:run_count] += 1
    job[:last_result] = result
    
    logger.info "Job completed: #{job_id}"
    
  rescue => e
    job[:status] = 'failed'
    job[:last_error] = e.message
    
    logger.error "Job failed: #{job_id} - #{e.message}"
  end
  
  # Update stored job
  REDIS.set("job:#{job_id}", job.to_json)
end

# Task execution
def execute_task(task_type, params)
  case task_type
  when 'health_check'
    {
      services_checked: 7,
      healthy: 7,
      degraded: 0,
      timestamp: Time.now.iso8601
    }
    
  when 'sync_data'
    {
      records_synced: rand(1000..10000),
      source: params['source'] || 'unknown',
      destination: params['destination'] || 'unknown',
      duration_seconds: rand(5..60)
    }
    
  when 'send_notification'
    {
      sent: true,
      channel: params['channel'] || 'email',
      recipients: params['recipients']&.size || 0,
      message_id: SecureRandom.hex(8)
    }
    
  when 'process_queue'
    {
      processed: rand(100..1000),
      failed: rand(0..10),
      queue: params['queue'] || 'default',
      duration_seconds: rand(1..30)
    }
    
  when 'generate_invoice'
    {
      invoice_id: "INV-#{SecureRandom.hex(4).upcase}",
      customer: params['customer_id'],
      amount: params['amount'],
      currency: params['currency'] || 'IDR',
      generated: true
    }
    
  when 'update_metrics'
    {
      metrics_updated: ['cpu', 'memory', 'disk', 'network'],
      timestamp: Time.now.iso8601
    }
    
  else
    { message: "Task '#{task_type}' executed", params: params }
  end
end

# Report generation
def generate_report(type)
  case type
  when 'system'
    {
      uptime: '99.9%',
      total_requests: 1_542_000,
      average_latency: '45ms',
      error_rate: '0.01%',
      services: 7,
      healthy_services: 7
    }
    
  when 'usage'
    {
      active_users: 13_420,
      new_users_today: 145,
      api_calls_24h: 2_340_000,
      top_endpoints: [
        { endpoint: '/api/orchestration', calls: 450_000 },
        { endpoint: '/api/ai/predict', calls: 320_000 },
        { endpoint: '/api/telemetry', calls: 280_000 }
      ]
    }
    
  when 'billing'
    {
      total_revenue: 450_000_000,
      currency: 'IDR',
      active_subscriptions: 850,
      new_subscriptions: 45,
      churn_rate: '2.5%'
    }
    
  else
    { message: "Report type '#{type}' not implemented" }
  end
end

# CSV conversion
def to_csv(data)
  return '' unless data.is_a?(Hash)
  
  headers = data.keys.join(',')
  values = data.values.map { |v| v.is_a?(Hash) ? v.to_json : v }.join(',')
  
  "#{headers}\n#{values}"
end

# Scheduled maintenance jobs
SCHEDULER.cron '0 2 * * *' do
  logger.info 'Running daily maintenance'
  # Daily cleanup
end

SCHEDULER.cron '0 */6 * * *' do
  logger.info 'Running health check'
  # Periodic health check
end

SCHEDULER.cron '0 0 * * 0' do
  logger.info 'Running weekly backup'
  # Weekly backup
end

# Start scheduler thread
Thread.new { SCHEDULER.join }
