package com.thegodseller.aegis

import android.annotation.SuppressLint
import android.os.Bundle
import android.webkit.PermissionRequest
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    // 🎯 URL เป้าหมาย: Dashboard ของเรา
    private val TARGET_URL = "https://aegis.thegodseller.com" 

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        webView = findViewById(R.id.webview)
        setupWebView()

        if (savedInstanceState == null) {
            webView.loadUrl(TARGET_URL)
        }

        // กด Back เพื่อย้อนหน้าเว็บ ไม่ใช่ปิดแอป
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (webView.canGoBack()) {
                    webView.goBack()
                } else {
                    isEnabled = false
                    onBackPressedDispatcher.onBackPressed()
                }
            }
        })
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun setupWebView() {
        val settings = webView.settings
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        settings.databaseEnabled = true
        settings.mixedContentMode = WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE
        settings.userAgentString += " AegisApp/1.0"

        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView?, url: String?): Boolean {
                return url != null && !url.contains("thegodseller.com")
            }
        }

        webView.webChromeClient = object : WebChromeClient() {
            // อนุญาตกล้องอัตโนมัติ (สำหรับฟีเจอร์สแกนหน้า/QR)
            override fun onPermissionRequest(request: PermissionRequest?) {
                request?.resources?.forEach { resource ->
                    if (resource == PermissionRequest.RESOURCE_VIDEO_CAPTURE) {
                        request.grant(request.resources)
                    }
                }
            }
        }
    }
}
