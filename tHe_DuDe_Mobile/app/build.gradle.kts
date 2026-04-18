plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.jetbrains.kotlin.android)
}

android {
    namespace = "com.thegodseller.themisverdict"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.thegodseller.themisverdict"
        minSdk = 24
        targetSdk = 34
        versionCode = 1
        versionName = "1.0.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        
        // Build Config Fields for API Endpoints
        buildConfigField("String", "AG_NEGOTIATOR_URL", "\"http://192.168.1.150:11112\"")
        buildConfigField("String", "AG_LIBRARIAN_URL", "\"http://192.168.1.150:11113\"")
        buildConfigField("String", "DB_MEM0_URL", "\"http://192.168.1.150:13332\"")
        buildConfigField("String", "WEB_CONTROL_URL", "\"http://192.168.1.150:11118\"")
    }

    signingConfigs {
        create("release") {
            storeFile = file("../my-release-key.jks")
            storePassword = "dudepassword"
            keyAlias = "aegis_key"
            keyPassword = "dudepassword"
        }
    }

    buildTypes {
        release {
            signingConfig = signingConfigs.getByName("release")
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
        debug {
            isDebuggable = true
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
    buildFeatures {
        viewBinding = true
        buildConfig = true
    }
}

dependencies {
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.appcompat)
    implementation(libs.material)
    implementation(libs.androidx.constraintlayout)
    implementation(libs.androidx.webkit)
    implementation(libs.androidx.cardview)
    implementation(libs.androidx.splashscreen)
    
    // Kotlin Coroutines for API calls
    implementation(libs.kotlinx.coroutines.android)
    implementation(libs.kotlinx.coroutines.core)
    
    // Testing
    testImplementation(libs.junit)
    androidTestImplementation(libs.androidx.test.ext.junit)
    androidTestImplementation(libs.espresso.core)
}
