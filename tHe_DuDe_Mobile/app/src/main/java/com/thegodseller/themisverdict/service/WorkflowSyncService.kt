package com.thegodseller.themisverdict.service

import android.app.Notification
import android.app.Service
import android.content.Intent
import android.os.Binder
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.util.Log
import androidx.core.app.NotificationCompat
import com.thegodseller.themisverdict.BuildConfig
import com.thegodseller.themisverdict.MainActivity
import com.thegodseller.themisverdict.R
import com.thegodseller.themisverdict.ThemisApplication
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.util.concurrent.Executors

/**
 * 🔄 Workflow Sync Service
 * 
 * Background service for:
 * - Real-time agent-to-agent synchronization
 * - Workflow status monitoring
 * - Notifications for important events
 */
class WorkflowSyncService : Service() {

    private val binder = LocalBinder()
    private val executor = Executors.newSingleThreadExecutor()
    private val handler = Handler(Looper.getMainLooper())
    
    private val TAG = "WorkflowService"
    
    companion object {
        const val SYNC_INTERVAL = 2000L // 2 seconds
    }
    
    private var isRunning = false
    private var lastWorkflowStatus: String? = null

    inner class LocalBinder : Binder() {
        fun getService(): WorkflowSyncService = this@WorkflowSyncService
    }

    override fun onBind(intent: Intent): IBinder {
        return binder
    }

    override fun onCreate() {
        super.onCreate()
        Log.d(TAG, "🔄 Workflow Sync Service created")
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (!isRunning) {
            startForeground()
            startSyncLoop()
            isRunning = true
        }
        return START_STICKY
    }

    private fun startForeground() {
        val notification: Notification = NotificationCompat.Builder(this, ThemisApplication.CHANNEL_WORKFLOW)
            .setContentTitle("⚖️ Themis Verdict")
            .setContentText("กำลังเชื่อมต่อกับระบบวิเคราะห์...")
            .setSmallIcon(R.drawable.ic_launcher_themis)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()

        startForeground(1, notification)
    }

    private fun startSyncLoop() {
        executor.execute {
            while (isRunning) {
                try {
                    syncWorkflowStatus()
                    Thread.sleep(SYNC_INTERVAL)
                } catch (e: InterruptedException) {
                    Log.e(TAG, "Sync loop interrupted: ${e.message}")
                    break
                } catch (e: Exception) {
                    Log.e(TAG, "Sync error: ${e.message}")
                    Thread.sleep(SYNC_INTERVAL * 2)
                }
            }
        }
    }

    private fun syncWorkflowStatus() {
        try {
            val url = URL("${BuildConfig.AG_NEGOTIATOR_URL}/api/workflow/status")
            val conn = url.openConnection() as HttpURLConnection
            conn.requestMethod = "GET"
            conn.connectTimeout = 5000
            conn.readTimeout = 5000

            if (conn.responseCode == HttpURLConnection.HTTP_OK) {
                val response = conn.inputStream.bufferedReader().use { it.readText() }
                
                if (response != lastWorkflowStatus) {
                    lastWorkflowStatus = response
                    handler.post {
                        broadcastWorkflowUpdate(response)
                    }
                    Log.d(TAG, "📊 Workflow synced: ${response.take(100)}...")
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to sync: ${e.message}")
        }
    }

    private fun broadcastWorkflowUpdate(status: String) {
        try {
            val json = JSONObject(status)
            val step = json.optString("step", "unknown")
            val progress = json.optInt("progress", 0)
            
            // Send broadcast to MainActivity
            val intent = Intent("themis.workflow.UPDATE").apply {
                putExtra("status", status)
                putExtra("step", step)
                putExtra("progress", progress)
            }
            sendBroadcast(intent)
            
            // Update notification if significant progress
            if (progress == 100) {
                updateNotification("✅ วิเคราะห์เสร็จสิ้น", "ดูผลลัพธ์ได้ในแอป")
            }
            
        } catch (e: Exception) {
            Log.e(TAG, "Failed to broadcast: ${e.message}")
        }
    }

    private fun updateNotification(title: String, content: String) {
        val notification: Notification = NotificationCompat.Builder(this, ThemisApplication.CHANNEL_WORKFLOW)
            .setContentTitle(title)
            .setContentText(content)
            .setSmallIcon(R.drawable.ic_launcher_themis)
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .build()

        val notificationManager = getSystemService(NOTIFICATION_SERVICE) as android.app.NotificationManager
        notificationManager.notify(1, notification)
    }

    override fun onDestroy() {
        super.onDestroy()
        isRunning = false
        executor.shutdown()
        Log.d(TAG, "🛑 Workflow Sync Service destroyed")
    }
}
