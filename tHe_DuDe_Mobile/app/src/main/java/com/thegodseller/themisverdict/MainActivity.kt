package com.thegodseller.themisverdict

import android.annotation.SuppressLint
import android.graphics.Bitmap
import android.os.Bundle
import android.util.Log
import android.view.View
import android.webkit.*
import android.widget.ProgressBar
import android.widget.Toast
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

/**
 * Themis Verdict: Manus Reasoning
 * Updated to Workflow Engine URL
 */
class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private lateinit var progressBar: ProgressBar
    
    private val TAG = "ThemisDebug"
    
    // 🎯 Themis Target URL (Updated to Local Workflow Engine)
    private val TARGET_URL = "${BuildConfig.WEB_CONTROL_URL}/workflows"

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        webView = findViewById(R.id.webview)
        progressBar = findViewById(R.id.progress_bar)
        
        setupWebView()

        if (savedInstanceState == null) {
            Log.d(TAG, "Loading URL: $TARGET_URL")
            webView.loadUrl(TARGET_URL)
        }

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
        settings.userAgentString += " ThemisVerdict/1.0 ManusReasoning/2.0"

        webView.addJavascriptInterface(ThemisAPIInterface(), "ThemisAndroid")

        webView.webViewClient = object : WebViewClient() {
            override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
                super.onPageStarted(view, url, favicon)
                Log.d(TAG, "Page started loading: $url")
                progressBar.visibility = View.VISIBLE
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                Log.d(TAG, "Page finished loading: $url")
                progressBar.visibility = View.GONE
                injectThemisBranding()
            }

            override fun onReceivedError(view: WebView?, request: WebResourceRequest?, error: WebResourceError?) {
                super.onReceivedError(view, request, error)
                val errMsg = "Error loading: ${error?.description} (Code: ${error?.errorCode})"
                Log.e(TAG, errMsg)
                if (request?.isForMainFrame == true) {
                    this@MainActivity.runOnUiThread {
                        Toast.makeText(this@MainActivity, errMsg, Toast.LENGTH_LONG).show()
                    }
                }
            }

            override fun onReceivedHttpError(view: WebView?, request: WebResourceRequest?, errorResponse: WebResourceResponse?) {
                super.onReceivedHttpError(view, request, errorResponse)
                Log.e(TAG, "HTTP Error: ${errorResponse?.statusCode} for ${request?.url}")
            }

            @SuppressLint("WebViewClientOnReceivedSslError")
            override fun onReceivedSslError(view: WebView?, handler: SslErrorHandler?, error: android.net.http.SslError?) {
                Log.e(TAG, "SSL Error: $error")
                handler?.proceed() 
            }
        }

        webView.webChromeClient = object : WebChromeClient() {
            override fun onConsoleMessage(consoleMessage: ConsoleMessage?): Boolean {
                Log.d(TAG, "JS Console: ${consoleMessage?.message()} -- From line ${consoleMessage?.lineNumber()} of ${consoleMessage?.sourceId()}")
                return true
            }

            override fun onPermissionRequest(request: PermissionRequest?) {
                request?.resources?.forEach { resource ->
                    if (resource == PermissionRequest.RESOURCE_VIDEO_CAPTURE) {
                        request.grant(request.resources)
                    }
                }
            }
        }
    }

    private fun injectThemisBranding() {
        val js = """
            javascript:(function() {
                if (!document.getElementById('themis-branding')) {
                    const branding = document.createElement('div');
                    branding.id = 'themis-branding';
                    branding.innerHTML = '⚖️ Themis Verdict: Manus Reasoning';
                    branding.style.cssText = 'position:fixed;top:0;left:0;right:0;background:#1a1a2e;color:#ffd700;padding:10px;text-align:center;z-index:9999;font-weight:bold;';
                    document.body.insertBefore(branding, document.body.firstChild);
                }
            })()
        """.trimIndent()
        webView.evaluateJavascript(js, null)
    }

    inner class ThemisAPIInterface {
        @JavascriptInterface
        fun queryHermes(intent: String, payload: String): String {
            return makeApiCall("${BuildConfig.AG_NEGOTIATOR_URL}/api/route", intent, payload)
        }
        
        @JavascriptInterface
        fun queryAthena(query: String, context: String): String {
            return makeApiCall("${BuildConfig.AG_LIBRARIAN_URL}/api/query", query, context)
        }
        
        @JavascriptInterface
        fun recordToMnemosyne(decision: String, reasoning: String, verdict: String): String {
            val jsonPayload = JSONObject().apply {
                put("decision", decision)
                put("reasoning", reasoning)
                put("verdict", verdict)
                put("timestamp", System.currentTimeMillis())
                put("source", "themis_verdict_android")
            }
            return makeApiCall("${BuildConfig.DB_MEM0_URL}/api/memory/record", jsonPayload.toString(), "")
        }
        
        @JavascriptInterface
        fun getDecisionHistory(limit: Int): String {
            return makeApiCall("${BuildConfig.DB_MEM0_URL}/api/memory/decisions?limit=$limit", "", "")
        }
        
        private fun makeApiCall(endpoint: String, payload: String, context: String): String {
            return try {
                val url = URL(endpoint)
                val conn = url.openConnection() as HttpURLConnection
                conn.requestMethod = "POST"
                conn.setRequestProperty("Content-Type", "application/json")
                conn.doOutput = true
                conn.connectTimeout = 30000
                conn.readTimeout = 30000
                
                val jsonBody = JSONObject().apply {
                    if (payload.isNotEmpty()) put("payload", payload)
                    if (context.isNotEmpty()) put("context", context)
                }
                
                conn.outputStream.write(jsonBody.toString().toByteArray())
                
                val responseCode = conn.responseCode
                if (responseCode == HttpURLConnection.HTTP_OK) {
                    conn.inputStream.bufferedReader().use { it.readText() }
                } else {
                    "{\"error\": \"HTTP $responseCode\"}"
                }
            } catch (e: Exception) {
                "{\"error\": \"${e.message}\"}"
            }
        }
    }
}
