package com.thegodseller.themisverdict

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.os.Build
import android.util.Log

/**
 * ⚖️ Themis Verdict Application
 * 
 * Initializes global app settings:
 * - Notification channels for workflow updates
 * - Global logging configuration
 * - Session manager initialization
 */
class ThemisApplication : Application() {

    companion object {
        const val CHANNEL_WORKFLOW = "themis_workflow_channel"
        const val TAG = "ThemisApp"
    }

    override fun onCreate() {
        super.onCreate()
        Log.d(TAG, "⚖️ Themis Verdict Application Started")
        
        createNotificationChannels()
    }

    private fun createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val workflowChannel = NotificationChannel(
                CHANNEL_WORKFLOW,
                "Themis Workflow",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Real-time workflow updates from Manus Reasoning"
                setShowBadge(true)
            }

            val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            notificationManager.createNotificationChannel(workflowChannel)
            
            Log.d(TAG, "📢 Notification channel created")
        }
    }
}
