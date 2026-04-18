# ProGuard Rules for Themis Verdict
# Add project specific ProGuard rules here

# Keep JavaScript Interface
-keepclassmembers class com.thegodseller.themisverdict.MainActivity$ThemisAPIInterface {
    @android.webkit.JavascriptInterface <methods>;
}

# Keep MainActivity
-keep public class com.thegodseller.themisverdict.MainActivity {
    public *;
}

# Kotlin Coroutines
-keepnames class kotlinx.coroutines.internal.MainDispatcherFactory {}
-keepnames class kotlinx.coroutines.CoroutineExceptionHandler {}
-keepclassmembers class kotlinx.coroutines.** {
    volatile <fields>;
}

# WebView
-keepclassmembers class * extends android.webkit.WebView {
    public *;
}

# JSON
-keepclassmembers class * {
    @org.json.* <fields>;
}

# General
-keepattributes *Annotation*
-keepattributes Signature
-keepattributes Exceptions
-keepattributes InnerClasses
-keepattributes EnclosingMethod
