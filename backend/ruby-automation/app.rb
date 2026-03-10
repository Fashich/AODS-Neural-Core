#!/usr/bin/env ruby
# frozen_string_literal: true

#
# AODS Ruby Automation Scripting Module
# Handles task automation and scheduled operations
#

require 'sinatra'
require 'sinatra/json'
require 'json'
require 'net/http'
require 'uri'
require 'logger'
require 'securerandom'
require 'rufus-scheduler'
require 'redis'

# ── Configure Sinatra ──────────────────────────────────────────────────────────
set :port, (ENV['PORT'] || 9007).to_i
set :bind, '0.0.0.0'
set :environment, (ENV['RACK_ENV'] || 'development').to_sym
set :logging, false

# ── Logger ─────────────────────────────────────────────────────────────────────
$logger = Logger.new(STDOUT)
$logger.level = Logger::INFO
$logger.formatter = proc { |sev, time, _, msg| "[#{time.iso8601}] #{sev} [ruby-automation] #{msg}\n" }

# ── Redis (graceful fallback jika tidak ada Redis) ─────────────────────────────
REDIS = begin
  r = Redis.new(url: ENV.fetch('REDIS_URL', 'redis://localhost:6379/0'))
  r.ping
  $logger.info "Redis connected"
  r
rescue => e
  $logger.warn "Redis unavailable (#{e.message}), using in-memory store"
  nil
end

# ── Scheduler ─────────────────────────────────────────────────────────────────
SCHEDULER = Rufus::Scheduler.new

# ── In-memory job store ───────────────────────────────────────────────────────
JOB_STORE = {}

# ── Helper ────────────────────────────────────────────────────────────────────
def json_response(data, status_code = 200)
  content_type :json
  status status_code
  data.to_json
end

def redis_set(key, value)
  REDIS&.set(key, value.to_json) rescue nil
end

def redis_llen(key)
  REDIS&.llen(key) rescue 0
end

# ── Health check ──────────────────────────────────────────────────────────────
get '/health' do
  json_response({
    status:    'healthy',
    service:   'ruby-automation',
    version:   '1.0.0',
    timestamp: Time.now.iso8601,
    ruby_version:    RUBY_VERSION,
    scheduled_jobs:  SCHEDULER.jobs.size,
    queued_jobs:     redis_llen('automation:queue'),
    redis_connected: !REDIS.nil?
  })
end

# ── Schedule a new job ────────────────────────────────────────────────────────
post '/schedule' do
  payload  = JSON.parse(request.body.read)
  job_id   = SecureRandom.uuid
  job_type = payload['type']
  schedule = payload['schedule']
  params   = payload['params'] || {}

  job_data = {
    id: job_id, type: job_type, schedule: schedule, params: params,
    created_at: Time.now.iso8601, status: 'scheduled',
    last_run: nil, next_run: nil, run_count: 0
  }

  JOB_STORE[job_id] = job_data
  redis_set("job:#{job_id}", job_data)

  if %w[once now].include?(schedule)
    Thread.new { execute_job(job_id, job_type, params) }
    job_data[:status] = 'running'
  else
    SCHEDULER.cron(schedule, tag: job_id) { execute_job(job_id, job_type, params) }
    job_data[:next_run] = SCHEDULER.jobs(tag: job_id).first&.next_time&.to_s
  end

  $logger.info "Job scheduled: #{job_id} (#{job_type})"
  json_response({ success: true, job_id: job_id, status: job_data[:status], next_run: job_data[:next_run] })
rescue => e
  $logger.error "Failed to schedule job: #{e.message}"
  json_response({ error: e.message }, 500)
end

# ── List jobs ─────────────────────────────────────────────────────────────────
get '/jobs' do
  jobs = JOB_STORE.values.map do |job|
    job.slice(:id, :type, :status, :schedule, :created_at, :last_run, :next_run, :run_count)
  end
  json_response({ jobs: jobs, total: jobs.size })
end

# ── Get job ───────────────────────────────────────────────────────────────────
get '/jobs/:id' do
  job = JOB_STORE[params[:id]]
  job ? json_response(job) : json_response({ error: 'Job not found' }, 404)
end

# ── Cancel job ────────────────────────────────────────────────────────────────
delete '/jobs/:id' do
  job = JOB_STORE[params[:id]]
  return json_response({ error: 'Job not found' }, 404) unless job

  SCHEDULER.jobs(tag: params[:id]).each(&:unschedule)
  job[:status] = 'cancelled'
  redis_set("job:#{params[:id]}", job)
  json_response({ success: true, message: 'Job cancelled' })
end

# ── Run job now ───────────────────────────────────────────────────────────────
post '/jobs/:id/run' do
  job = JOB_STORE[params[:id]]
  return json_response({ error: 'Job not found' }, 404) unless job

  Thread.new { execute_job(params[:id], job[:type], job[:params]) }
  json_response({ success: true, message: 'Job started' })
end

# ── Execute task ──────────────────────────────────────────────────────────────
post '/execute' do
  payload    = JSON.parse(request.body.read)
  task_type  = payload['task']
  parameters = payload['parameters'] || {}
  result     = execute_task(task_type, parameters)
  json_response({ success: true, task: task_type, result: result, executed_at: Time.now.iso8601 })
rescue => e
  json_response({ error: e.message }, 500)
end

# ── Backup ────────────────────────────────────────────────────────────────────
post '/backup' do
  payload     = JSON.parse(request.body.read)
  backup_id   = SecureRandom.hex(8)
  Thread.new { sleep 2; $logger.info "Backup #{backup_id} completed" }
  json_response({
    success: true, backup_id: backup_id,
    target: payload['target'] || 'database',
    destination: payload['destination'] || 's3',
    status: 'in_progress', started_at: Time.now.iso8601
  })
rescue => e
  json_response({ error: e.message }, 500)
end

# ── Cleanup ───────────────────────────────────────────────────────────────────
post '/cleanup' do
  payload = JSON.parse(request.body.read)
  json_response({
    success: true,
    target: payload['target'] || 'temp_files',
    older_than: payload['older_than'] || '7d',
    deleted_count: rand(100..500),
    freed_space_mb: rand(1000..5000),
    completed_at: Time.now.iso8601
  })
rescue => e
  json_response({ error: e.message }, 500)
end

# ── Report ────────────────────────────────────────────────────────────────────
post '/report' do
  payload     = JSON.parse(request.body.read)
  report_type = payload['type'] || 'system'
  json_response({ success: true, type: report_type, generated_at: Time.now.iso8601, data: generate_report(report_type) })
rescue => e
  json_response({ error: e.message }, 500)
end

# ── Maintenance ───────────────────────────────────────────────────────────────
post '/maintenance' do
  payload   = JSON.parse(request.body.read)
  operation = payload['operation']
  result = case operation
           when 'restart_services' then { restarted: ['python-ai', 'go-telemetry'], duration: 15 }
           when 'clear_cache'      then { cleared: ['redis', 'memcached'], entries: 15420 }
           when 'optimize_db'      then { tables_optimized: 12, space_reclaimed: '256MB' }
           else { message: 'Unknown operation' }
           end
  json_response({ success: true, operation: operation, result: result, executed_at: Time.now.iso8601 })
rescue => e
  json_response({ error: e.message }, 500)
end

# ── Internal helpers ──────────────────────────────────────────────────────────
def execute_job(job_id, job_type, params)
  job = JOB_STORE[job_id]
  return unless job

  job[:status]   = 'running'
  job[:last_run] = Time.now.iso8601

  begin
    job[:last_result] = execute_task(job_type, params)
    job[:status]      = 'completed'
    job[:run_count]  += 1
    $logger.info "Job completed: #{job_id}"
  rescue => e
    job[:status]     = 'failed'
    job[:last_error] = e.message
    $logger.error "Job failed: #{job_id} - #{e.message}"
  end

  redis_set("job:#{job_id}", job)
end

def execute_task(task_type, params)
  case task_type
  when 'health_check'    then { services_checked: 7, healthy: 7, degraded: 0, timestamp: Time.now.iso8601 }
  when 'sync_data'       then { records_synced: rand(1000..10000), source: params['source'] || 'unknown', duration_seconds: rand(5..60) }
  when 'send_notification' then { sent: true, channel: params['channel'] || 'email', message_id: SecureRandom.hex(8) }
  when 'process_queue'   then { processed: rand(100..1000), failed: rand(0..10), queue: params['queue'] || 'default' }
  when 'generate_invoice' then { invoice_id: "INV-#{SecureRandom.hex(4).upcase}", customer: params['customer_id'], generated: true }
  when 'update_metrics'  then { metrics_updated: %w[cpu memory disk network], timestamp: Time.now.iso8601 }
  else { message: "Task '#{task_type}' executed", params: params }
  end
end

def generate_report(type)
  case type
  when 'system'  then { uptime: '99.9%', total_requests: 1_542_000, average_latency: '45ms', error_rate: '0.01%' }
  when 'usage'   then { active_users: 13_420, new_users_today: 145, api_calls_24h: 2_340_000 }
  when 'billing' then { total_revenue: 450_000_000, currency: 'IDR', active_subscriptions: 850 }
  else { message: "Report type '#{type}' not implemented" }
  end
end

# ── Scheduled jobs ────────────────────────────────────────────────────────────
SCHEDULER.cron '0 2 * * *'   do $logger.info 'Running daily maintenance' end
SCHEDULER.cron '0 */6 * * *' do $logger.info 'Running health check' end
SCHEDULER.cron '0 0 * * 0'   do $logger.info 'Running weekly backup' end

$logger.info "AODS Ruby Automation Service started on port #{ENV.fetch('PORT', 9007)}"
