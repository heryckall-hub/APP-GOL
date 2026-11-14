export type NeonThemeId = 'cyan' | 'red' | 'amber';
export type FuelTypeId = 'GASOLINE' | 'ETHANOL';

export interface LauncherConfig {
  carName: string;
  speedLimitKmh: number;
  neonTheme: NeonThemeId;
  engineDisplacementLiters: number;
  fuelType: FuelTypeId;
  fuelPriceBrl: number;
  splashEnabled: boolean;
}

export interface AndroidProjectFile {
  id: string;
  name: string;
  path: string;
  category: 'Manifest & Gradle' | 'Core & Tema' | 'Hardware & Trip' | 'ViewModel & Model' | 'Compose UI';
  language: 'kotlin' | 'xml' | 'gradle';
  summary: string;
  code: string;
}

export const NEON_HEX_MAP: Record<NeonThemeId, { label: string; primaryHex: string; secondaryHex: string }> = {
  cyan: { label: 'Azul Ciano / Elétrico', primaryHex: '0xFF3B82F6', secondaryHex: '0xFF38BDF8' },
  red: { label: 'Vermelho Esportivo', primaryHex: '0xFFFF2E4C', secondaryHex: '0xFFEF4444' },
  amber: { label: 'Âmbar Painel', primaryHex: '0xFFFFB020', secondaryHex: '0xFFF59E0B' }
};

export const PROJECT_TREE_TEXT = `GolCockpitLauncher/
├── app/
│   ├── build.gradle.kts
│   └── src/
│       └── main/
│           ├── AndroidManifest.xml
│           ├── res/
│           │   ├── drawable/
│           │   │   └── meu_carro.png
│           │   └── values/
│           │       └── themes.xml
│           └── java/com/garagem/launcher/
│               ├── MainActivity.kt
│               ├── hardware/
│               │   ├── ObdBluetoothManager.kt
│               │   ├── SystemMediaBridge.kt
│               │   └── TripComputerManager.kt
│               ├── model/
│               │   └── LauncherModels.kt
│               ├── ui/
│               │   ├── theme/
│               │   │   └── Theme.kt
│               │   ├── SplashIntroOverlay.kt
│               │   ├── DashboardScreen.kt
│               │   └── AppDrawerDialog.kt
│               └── viewmodel/
│                   └── GpsAndWeatherViewModel.kt`;

export function buildAndroidProjectFiles(config: LauncherConfig): AndroidProjectFile[] {
  const safeCarName = (config.carName.trim() || 'GOL 1999').replace(/"/g, '\\"');
  const neon = NEON_HEX_MAP[config.neonTheme];
  const speedLimit = Math.max(20, Math.min(240, Math.round(config.speedLimitKmh || 100)));
  const displacement = Number((config.engineDisplacementLiters || 1.6).toFixed(1));
  const fuelPrice = Number((config.fuelPriceBrl || 5.89).toFixed(2));

  return [
    {
      id: 'manifest',
      name: 'AndroidManifest.xml',
      path: 'app/src/main/AndroidManifest.xml',
      category: 'Manifest & Gradle',
      language: 'xml',
      summary: 'Launcher oficial (MAIN, HOME, DEFAULT), travado em landscape, GPS, Internet, Bluetooth OBD2 e QUERY_ALL_PACKAGES.',
      code: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools">

    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

    <uses-permission
        android:name="android.permission.BLUETOOTH"
        android:maxSdkVersion="30" />
    <uses-permission
        android:name="android.permission.BLUETOOTH_ADMIN"
        android:maxSdkVersion="30" />
    <uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />
    <uses-permission
        android:name="android.permission.BLUETOOTH_SCAN"
        android:usesPermissionFlags="neverForLocation"
        tools:targetApi="s" />

    <uses-permission
        android:name="android.permission.QUERY_ALL_PACKAGES"
        tools:ignore="QueryAllPackagesPermission" />

    <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />

    <uses-feature android:name="android.hardware.location.gps" android:required="false" />
    <uses-feature android:name="android.hardware.bluetooth" android:required="false" />

    <application
        android:allowBackup="true"
        android:hardwareAccelerated="true"
        android:icon="@mipmap/ic_launcher"
        android:label="Gol Cockpit Launcher"
        android:supportsRtl="false"
        android:theme="@android:style/Theme.Material.NoActionBar.Fullscreen">

        <activity
            android:name=".MainActivity"
            android:clearTaskOnLaunch="true"
            android:configChanges="orientation|screenSize|screenLayout|smallestScreenSize|keyboardHidden|uiMode"
            android:exported="true"
            android:launchMode="singleTask"
            android:screenOrientation="landscape"
            android:stateNotNeeded="true"
            android:windowSoftInputMode="stateAlwaysHidden">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.HOME" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>`
    },
    {
      id: 'gradle',
      name: 'build.gradle.kts',
      path: 'app/build.gradle.kts',
      category: 'Manifest & Gradle',
      language: 'gradle',
      summary: 'Configuração Gradle com minSdk 24, Compose Material 3, Coroutines e FusedLocationProviderClient.',
      code: `plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.compose")
}

android {
    namespace = "com.garagem.launcher"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.garagem.launcher"
        minSdk = 24
        targetSdk = 34
        versionCode = 1
        versionName = "1.2.0"

        vectorDrawables {
            useSupportLibrary = true
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
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
        compose = true
    }

    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
        }
    }
}

dependencies {
    val composeBom = platform("androidx.compose:compose-bom:2024.09.02")
    implementation(composeBom)

    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.activity:activity-compose:1.9.2")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.8.6")
    implementation("androidx.lifecycle:lifecycle-runtime-compose:2.8.6")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.8.6")

    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-graphics")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.material:material-icons-extended")

    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.8.1")
    implementation("com.google.android.gms:play-services-location:21.3.0")

    debugImplementation("androidx.compose.ui:ui-tooling")
}`
    },
    {
      id: 'main-activity',
      name: 'MainActivity.kt',
      path: 'app/src/main/java/com/garagem/launcher/MainActivity.kt',
      category: 'Core & Tema',
      language: 'kotlin',
      summary: 'Activity Launcher com receptor de despertar (ACTION_SCREEN_ON) para acionar SplashIntroOverlay enquanto GPS/OBD/mídia iniciam em segundo plano.',
      code: `package com.garagem.launcher

import android.Manifest
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.ActivityInfo
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import android.speech.RecognizerIntent
import android.view.WindowManager
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedCallback
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.viewModels
import androidx.compose.runtime.getValue
import androidx.core.content.ContextCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.garagem.launcher.ui.DashboardScreen
import com.garagem.launcher.ui.theme.GaragemNoturnaTheme
import com.garagem.launcher.viewmodel.GpsAndWeatherViewModel
import com.garagem.launcher.viewmodel.GpsAndWeatherViewModelFactory

class MainActivity : ComponentActivity() {

    private val viewModel: GpsAndWeatherViewModel by viewModels {
        GpsAndWeatherViewModelFactory(applicationContext)
    }

    private var screenWakeReceiverRegistered = false

    private val screenWakeReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            if (intent?.action == Intent.ACTION_SCREEN_ON || intent?.action == Intent.ACTION_USER_PRESENT) {
                viewModel.triggerSplashIfEnabled()
                viewModel.reconnectLastObdIfNeeded()
            }
        }
    }

    private val permissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { result ->
        val locationGranted =
            result[Manifest.permission.ACCESS_FINE_LOCATION] == true ||
                result[Manifest.permission.ACCESS_COARSE_LOCATION] == true ||
                hasLocationPermission()

        val bluetoothGranted = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            result[Manifest.permission.BLUETOOTH_CONNECT] == true ||
                hasBluetoothPermission()
        } else {
            true
        }

        viewModel.onPermissionsUpdated(locationGranted, bluetoothGranted)
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        enableImmersiveFullscreen()

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                viewModel.dismissAllOverlays()
            }
        })

        registerWakeReceiver()
        requestInitialPermissions()
        viewModel.triggerSplashIfEnabled()

        setContent {
            val uiState by viewModel.uiState.collectAsStateWithLifecycle()

            GaragemNoturnaTheme(
                accentPreset = uiState.accentPreset,
                dimmerAlpha = uiState.dimmerAlpha
            ) {
                DashboardScreen(
                    state = uiState,
                    onSkipSplash = viewModel::dismissSplashIntro,
                    onReplaySplash = viewModel::forceReplaySplash,
                    onOpenDrawer = { viewModel.openAppDrawer(replacingSlotIndex = null) },
                    onCloseDrawer = viewModel::closeAppDrawer,
                    onOpenSettings = viewModel::openSettingsDialog,
                    onCloseSettings = viewModel::closeSettingsDialog,
                    onOpenObdDialog = viewModel::openObdDialog,
                    onCloseObdDialog = viewModel::closeObdDialog,
                    onOpenTripDialog = viewModel::openTripDialog,
                    onCloseTripDialog = viewModel::closeTripDialog,
                    onLaunchApp = ::launchPackage,
                    onShortcutClick = { slotIndex, shortcut ->
                        val launched = launchPackage(shortcut.packageName)
                        if (!launched) {
                            viewModel.openAppDrawer(replacingSlotIndex = slotIndex)
                        }
                    },
                    onStartReplaceShortcut = { slotIndex ->
                        viewModel.openAppDrawer(replacingSlotIndex = slotIndex)
                    },
                    onAssignShortcut = viewModel::assignQuickShortcut,
                    onVoiceCommand = ::launchVoiceAssistant,
                    onVolumeDown = viewModel::volumeDown,
                    onVolumeUp = viewModel::volumeUp,
                    onMediaPrevious = viewModel::mediaPrevious,
                    onMediaPlayPause = viewModel::mediaPlayPause,
                    onMediaNext = viewModel::mediaNext,
                    onGrantMediaPermission = ::openMediaNotificationAccess,
                    onCycleDimmer = viewModel::cycleDimmer,
                    onResetTrip = viewModel::resetTrip,
                    onRefreshPairedDevices = viewModel::refreshPairedBluetoothDevices,
                    onConnectObdDevice = viewModel::connectObdDevice,
                    onDisconnectObd = viewModel::disconnectObd,
                    onReadDtcCodes = viewModel::readDtcCodes,
                    onClearDtcCodes = viewModel::clearDtcCodes,
                    onUpdateFullConfig = viewModel::updateFullConfig,
                    onRefreshWeather = viewModel::refreshWeatherNow,
                    onOpenWifiSettings = {
                        startActivity(Intent(Settings.ACTION_WIFI_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
                    },
                    onOpenBluetoothSettings = {
                        startActivity(Intent(Settings.ACTION_BLUETOOTH_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
                    }
                )
            }
        }
    }

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (hasFocus) enableImmersiveFullscreen()
    }

    override fun onStart() {
        super.onStart()
        viewModel.startBackgroundServices(
            hasLocationPermission = hasLocationPermission(),
            hasBluetoothPermission = hasBluetoothPermission()
        )
        viewModel.refreshInstalledApps()
        viewModel.syncMediaPermissionStatus()
    }

    override fun onStop() {
        super.onStop()
        viewModel.stopLocationUpdates()
    }

    override fun onDestroy() {
        super.onDestroy()
        if (screenWakeReceiverRegistered) {
            runCatching { unregisterReceiver(screenWakeReceiver) }
            screenWakeReceiverRegistered = false
        }
    }

    private fun registerWakeReceiver() {
        if (screenWakeReceiverRegistered) return
        val filter = IntentFilter().apply {
            addAction(Intent.ACTION_SCREEN_ON)
            addAction(Intent.ACTION_USER_PRESENT)
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(screenWakeReceiver, filter, Context.RECEIVER_NOT_EXPORTED)
        } else {
            @Suppress("DEPRECATION")
            registerReceiver(screenWakeReceiver, filter)
        }
        screenWakeReceiverRegistered = true
    }

    private fun enableImmersiveFullscreen() {
        WindowCompat.setDecorFitsSystemWindows(window, false)
        val controller = WindowInsetsControllerCompat(window, window.decorView)
        controller.systemBarsBehavior =
            WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
        controller.hide(WindowInsetsCompat.Type.systemBars())
    }

    private fun requestInitialPermissions() {
        val needed = mutableListOf(
            Manifest.permission.ACCESS_FINE_LOCATION,
            Manifest.permission.ACCESS_COARSE_LOCATION
        )
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            needed += Manifest.permission.BLUETOOTH_CONNECT
            needed += Manifest.permission.BLUETOOTH_SCAN
        }
        val missing = needed.filter {
            ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
        }
        if (missing.isEmpty()) {
            viewModel.onPermissionsUpdated(hasLocation = true, hasBluetooth = true)
        } else {
            permissionLauncher.launch(missing.toTypedArray())
        }
    }

    private fun hasLocationPermission(): Boolean {
        return ContextCompat.checkSelfPermission(
            this,
            Manifest.permission.ACCESS_FINE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED ||
            ContextCompat.checkSelfPermission(
                this,
                Manifest.permission.ACCESS_COARSE_LOCATION
            ) == PackageManager.PERMISSION_GRANTED
    }

    private fun hasBluetoothPermission(): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            ContextCompat.checkSelfPermission(
                this,
                Manifest.permission.BLUETOOTH_CONNECT
            ) == PackageManager.PERMISSION_GRANTED
        } else {
            true
        }
    }

    private fun launchPackage(packageName: String): Boolean {
        return try {
            val intent = packageManager.getLaunchIntentForPackage(packageName) ?: return false
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            startActivity(intent)
            true
        } catch (_: Exception) {
            false
        }
    }

    private fun launchVoiceAssistant() {
        val voiceIntent = Intent(RecognizerIntent.ACTION_WEB_SEARCH).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        runCatching { startActivity(voiceIntent) }
    }

    private fun openMediaNotificationAccess() {
        val intent = Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        runCatching { startActivity(intent) }
        viewModel.enableDemoMediaControl()
    }
}`
    },
    {
      id: 'theme',
      name: 'Theme.kt',
      path: 'app/src/main/java/com/garagem/launcher/ui/theme/Theme.kt',
      category: 'Core & Tema',
      language: 'kotlin',
      summary: 'Sistema de design Premium Dark: gradientes neon, superfícies metálicas escovadas, reflexo em vidro, bordas com glow e fontes de alto contraste.',
      code: `package com.garagem.launcher.ui.theme

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawWithContent
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shadow
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.garagem.launcher.model.NeonAccentPreset

@Immutable
data class GaragePalette(
    val canvasTop: Color = Color(0xFF04070D),
    val canvasBottom: Color = Color(0xFF0A111F),
    val metallicTop: Color = Color(0xE8182640),
    val metallicMid: Color = Color(0xF00D1628),
    val metallicBottom: Color = Color(0xF7070C17),
    val glassHighlight: Color = Color(0x28FFFFFF),
    val glassEdge: Color = Color(0x18FFFFFF),
    val panelSurface: Color = Color(0xD80D1526),
    val tileSurface: Color = Color(0xEB13203A),
    val tileSelected: Color = Color(0xFF2563EB),
    val borderGlow: Color = Color(0xFF38BDF8),
    val textPrimary: Color = Color(0xFFFFFFFF),
    val textSecondary: Color = Color(0xFFCBD5E1),
    val neonPrimary: Color = Color(${neon.primaryHex}),
    val neonSecondary: Color = Color(${neon.secondaryHex}),
    val alertRed: Color = Color(0xFFFF2E4C),
    val okGreen: Color = Color(0xFF10B981),
    val warningAmber: Color = Color(0xFFF59E0B)
)

val LocalGaragePalette = staticCompositionLocalOf { GaragePalette() }

/**
 * Superfície metálica escura com gradiente escovado, reflexo diagonal em vidro
 * e borda luminosa (glow) configurável para cards do cockpit.
 */
fun Modifier.premiumMetallicCard(
    glowColor: Color,
    cornerRadius: Dp = 16.dp,
    glowAlpha: Float = 0.62f
): Modifier {
    val shape = RoundedCornerShape(cornerRadius)
    return this
        .clip(shape)
        .background(
            Brush.linearGradient(
                colors = listOf(
                    Color(0xEB192844),
                    Color(0xF20D1628),
                    Color(0xFA060B15)
                ),
                start = Offset(0f, 0f),
                end = Offset(420f, 520f)
            )
        )
        .drawWithContent {
            drawContent()
            val radiusPx = cornerRadius.toPx()
            // Reflexo especular em vidro na diagonal superior esquerda
            drawRoundRect(
                brush = Brush.linearGradient(
                    colors = listOf(
                        Color.White.copy(alpha = 0.14f),
                        Color.White.copy(alpha = 0.03f),
                        Color.Transparent
                    ),
                    start = Offset.Zero,
                    end = Offset(size.width * 0.65f, size.height * 0.55f)
                ),
                cornerRadius = CornerRadius(radiusPx, radiusPx)
            )
            // Halo externo neon suave + borda interna cristalina
            drawRoundRect(
                color = glowColor.copy(alpha = 0.20f),
                cornerRadius = CornerRadius(radiusPx, radiusPx),
                style = Stroke(width = 4.dp.toPx())
            )
        }
        .border(
            width = 1.dp,
            brush = Brush.linearGradient(
                listOf(
                    glowColor.copy(alpha = glowAlpha),
                    Color.White.copy(alpha = 0.18f),
                    glowColor.copy(alpha = glowAlpha * 0.55f)
                )
            ),
            shape = shape
        )
}

/**
 * Superfície de vidro automotivo translúcido com brilho superior e contorno neon.
 */
fun Modifier.premiumGlassCard(
    glowColor: Color,
    cornerRadius: Dp = 14.dp
): Modifier {
    val shape = RoundedCornerShape(cornerRadius)
    return this
        .clip(shape)
        .background(
            Brush.verticalGradient(
                colors = listOf(
                    Color(0xCC162440),
                    Color(0xE609101E)
                )
            )
        )
        .border(
            width = 1.dp,
            brush = Brush.verticalGradient(
                listOf(
                    Color.White.copy(alpha = 0.24f),
                    glowColor.copy(alpha = 0.42f)
                )
            ),
            shape = shape
        )
}

private val GarageTypography = Typography(
    displayLarge = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.Black,
        fontSize = 68.sp,
        lineHeight = 72.sp,
        letterSpacing = (-1.5).sp,
        fontFeatureSettings = "tnum",
        shadow = Shadow(
            color = Color(0x8838BDF8),
            offset = Offset(0f, 0f),
            blurRadius = 22f
        )
    ),
    displayMedium = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.ExtraBold,
        fontSize = 42.sp,
        lineHeight = 46.sp,
        letterSpacing = (-0.8).sp,
        fontFeatureSettings = "tnum",
        shadow = Shadow(
            color = Color(0x6638BDF8),
            offset = Offset(0f, 0f),
            blurRadius = 16f
        )
    ),
    titleLarge = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.Bold,
        fontSize = 20.sp,
        lineHeight = 24.sp,
        letterSpacing = 0.2.sp,
        fontFeatureSettings = "tnum"
    ),
    titleMedium = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.Bold,
        fontSize = 15.sp,
        lineHeight = 20.sp
    ),
    bodyMedium = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.Medium,
        fontSize = 13.sp,
        lineHeight = 18.sp
    )
)

@Composable
fun GaragemNoturnaTheme(
    accentPreset: NeonAccentPreset = NeonAccentPreset.${config.neonTheme.toUpperCase()},
    dimmerAlpha: Float = 0f,
    content: @Composable () -> Unit
) {
    val (primary, secondary) = when (accentPreset) {
        NeonAccentPreset.CYAN -> Color(0xFF2563EB) to Color(0xFF38BDF8)
        NeonAccentPreset.RED -> Color(0xFFDC2626) to Color(0xFFFF2E4C)
        NeonAccentPreset.AMBER -> Color(0xFFD97706) to Color(0xFFFFB020)
    }

    val palette = GaragePalette(
        neonPrimary = primary,
        neonSecondary = secondary,
        borderGlow = secondary
    )

    val colorScheme = darkColorScheme(
        primary = primary,
        onPrimary = Color.White,
        secondary = secondary,
        background = palette.canvasTop,
        onBackground = palette.textPrimary,
        surface = palette.panelSurface,
        onSurface = palette.textPrimary,
        surfaceVariant = palette.tileSurface,
        onSurfaceVariant = palette.textSecondary,
        outline = palette.borderGlow,
        error = palette.alertRed
    )

    CompositionLocalProvider(LocalGaragePalette provides palette) {
        MaterialTheme(
            colorScheme = colorScheme,
            typography = GarageTypography
        ) {
            Box(modifier = Modifier.fillMaxSize()) {
                content()
                if (dimmerAlpha > 0f) {
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .background(Color.Black.copy(alpha = dimmerAlpha.coerceIn(0f, 0.68f)))
                    )
                }
            }
        }
    }
}`
    },
    {
      id: 'models',
      name: 'LauncherModels.kt',
      path: 'app/src/main/java/com/garagem/launcher/model/LauncherModels.kt',
      category: 'ViewModel & Model',
      language: 'kotlin',
      summary: 'Modelos imutáveis para OBD2 (Bluetooth pareados, DTCs traduzidos, PIDs), Computador de Bordo (km/l, R$), Splash e Launcher.',
      code: `package com.garagem.launcher.model

import androidx.compose.runtime.Immutable
import androidx.compose.ui.graphics.ImageBitmap

enum class NeonAccentPreset(val label: String) {
    CYAN("Azul Neon"),
    RED("Vermelho"),
    AMBER("Âmbar")
}

enum class FuelType(
    val label: String,
    val stoichAfr: Float,
    val densityKgPerLiter: Float,
    val baseReferenceKmPerLiter: Float
) {
    GASOLINE("Gasolina", 14.7f, 0.745f, 12.2f),
    ETHANOL("Etanol", 9.0f, 0.789f, 8.6f)
}

enum class ObdConnectionState(val label: String) {
    DISCONNECTED("Desconectado"),
    CONNECTING("Conectando"),
    CONNECTED("Conectado"),
    RECONNECTING("Reconectando")
}

@Immutable
data class PairedBluetoothDevice(
    val name: String,
    val address: String
)

@Immutable
data class DtcFaultCode(
    val code: String,
    val descriptionPtBr: String
)

@Immutable
data class ObdTelemetry(
    val connectionState: ObdConnectionState = ObdConnectionState.DISCONNECTED,
    val connectedDeviceName: String = "",
    val connectedDeviceAddress: String = "",
    val rpm: Int = 0,
    val vehicleSpeedKmh: Int = 0,
    val coolantTempC: Int = 90,
    val batteryVoltage: Float = 12.6f,
    val engineLoadPercent: Int = 0,
    val intakeTempC: Int = 30,
    val mafGramsPerSec: Float? = null,
    val mapKpa: Int? = null,
    val dtcCodes: List<DtcFaultCode> = emptyList(),
    val lastError: String? = null
)

@Immutable
data class TripSummaryState(
    val distanceKm: Float = 0f,
    val activeDrivingSeconds: Long = 0L,
    val averageSpeedKmh: Float = 0f,
    val instantKmPerLiter: Float = 0f,
    val averageKmPerLiter: Float = 0f,
    val fuelConsumedLiters: Float = 0f,
    val estimatedCostBrl: Float = 0f,
    val usingObdSource: Boolean = false
)

@Immutable
data class WeatherState(
    val temperatureCelsius: Int? = 22,
    val conditionLabel: String = "Céu Limpo",
    val isLoading: Boolean = false
)

@Immutable
data class MediaPlaybackState(
    val hasNotificationPermission: Boolean = false,
    val title: String = "Controle de música desligado",
    val subtitle: String = "Toque aqui para permitir",
    val isPlaying: Boolean = false,
    val volumeLevel: Int = 10,
    val volumeMax: Int = 15
)

@Immutable
data class QuickShortcut(
    val slotIndex: Int,
    val label: String,
    val packageName: String
)

@Immutable
data class InstalledAppInfo(
    val label: String,
    val packageName: String,
    val icon: ImageBitmap?
)

@Immutable
data class LauncherUiState(
    val carName: String = "${safeCarName}",
    val speedLimitKmh: Int = ${speedLimit},
    val accentPreset: NeonAccentPreset = NeonAccentPreset.${config.neonTheme.toUpperCase()},
    val engineDisplacementLiters: Float = ${displacement}f,
    val fuelType: FuelType = FuelType.${config.fuelType},
    val fuelPriceBrl: Float = ${fuelPrice}f,
    val splashAnimationEnabled: Boolean = ${config.splashEnabled},
    val showSplashIntro: Boolean = ${config.splashEnabled},
    val dimmerAlpha: Float = 0f,
    val wifiConnected: Boolean = true,
    val bluetoothConnected: Boolean = true,
    val gpsSpeedKmh: Int = 0,
    val hasGpsFix: Boolean = false,
    val hasLocationPermission: Boolean = false,
    val hasBluetoothPermission: Boolean = false,
    val pairedDevices: List<PairedBluetoothDevice> = emptyList(),
    val clockText: String = "--:--",
    val dateText: String = "--",
    val weather: WeatherState = WeatherState(),
    val obd: ObdTelemetry = ObdTelemetry(),
    val trip: TripSummaryState = TripSummaryState(),
    val media: MediaPlaybackState = MediaPlaybackState(),
    val shortcuts: List<QuickShortcut> = defaultQuickShortcuts(),
    val installedApps: List<InstalledAppInfo> = emptyList(),
    val isAppDrawerOpen: Boolean = false,
    val replacingSlotIndex: Int? = null,
    val isSettingsOpen: Boolean = false,
    val isObdDialogOpen: Boolean = false,
    val isTripDialogOpen: Boolean = false
) {
    // Prioriza a velocidade vinda da ECU via OBD2 quando conectado
    val activeSpeedKmh: Int
        get() = if (obd.connectionState == ObdConnectionState.CONNECTED) {
            obd.vehicleSpeedKmh
        } else {
            gpsSpeedKmh
        }

    val isOverSpeedLimit: Boolean
        get() = activeSpeedKmh > speedLimitKmh
}

fun defaultQuickShortcuts(): List<QuickShortcut> = listOf(
    QuickShortcut(0, "WAZE", "com.waze"),
    QuickShortcut(1, "GOOGLE MAPS", "com.google.android.apps.maps"),
    QuickShortcut(2, "SPOTIFY", "com.spotify.music"),
    QuickShortcut(3, "YOUTUBE MUSIC", "com.google.android.apps.youtube.music"),
    QuickShortcut(4, "ANDROID AUTO", "com.google.android.projection.gearhead")
)`
    },
    {
      id: 'obd-bluetooth-manager',
      name: 'ObdBluetoothManager.kt',
      path: 'app/src/main/java/com/garagem/launcher/hardware/ObdBluetoothManager.kt',
      category: 'Hardware & Trip',
      language: 'kotlin',
      summary: 'Gerenciador completo ELM327 via BluetoothSocket SPP: pareados, ATZ/ATE0/ATL0/ATSP0, timeout, reconexão automática, PIDs e DTC Mode 03/04.',
      code: `package com.garagem.launcher.hardware

import android.annotation.SuppressLint
import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothManager
import android.bluetooth.BluetoothSocket
import android.content.Context
import android.os.Build
import com.garagem.launcher.model.DtcFaultCode
import com.garagem.launcher.model.ObdConnectionState
import com.garagem.launcher.model.ObdTelemetry
import com.garagem.launcher.model.PairedBluetoothDevice
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withContext
import java.io.IOException
import java.io.InputStream
import java.io.OutputStream
import java.util.UUID

class ObdBluetoothManager(private val context: Context) {

    companion object {
        private val SPP_UUID: UUID = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB")
        private const val COMMAND_TIMEOUT_MS = 1300L
        private const val RECONNECT_DELAY_MS = 3500L
    }

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private val ioMutex = Mutex()

    private val _telemetry = MutableStateFlow(ObdTelemetry())
    val telemetry: StateFlow<ObdTelemetry> = _telemetry.asStateFlow()

    private val _pairedDevices = MutableStateFlow<List<PairedBluetoothDevice>>(emptyList())
    val pairedDevices: StateFlow<List<PairedBluetoothDevice>> = _pairedDevices.asStateFlow()

    private var connectionJob: Job? = null
    private var activeSocket: BluetoothSocket? = null
    private var activeInput: InputStream? = null
    private var activeOutput: OutputStream? = null
    private var targetMacAddress: String? = null
    private var autoReconnectEnabled = false

    @SuppressLint("MissingPermission")
    fun refreshPairedDevices(hasPermission: Boolean): List<PairedBluetoothDevice> {
        if (!hasPermission) {
            _pairedDevices.value = emptyList()
            return emptyList()
        }
        val adapter = getBluetoothAdapter()
        if (adapter == null || !adapter.isEnabled) {
            _pairedDevices.value = emptyList()
            return emptyList()
        }
        val list = adapter.bondedDevices.orEmpty().map { device ->
            PairedBluetoothDevice(
                name = device.name ?: "Dispositivo Bluetooth",
                address = device.address
            )
        }.sortedByDescending {
            val n = it.name.uppercase()
            n.contains("OBD") || n.contains("ELM") || n.contains("VGATE") || n.contains("KONNWEI")
        }
        _pairedDevices.value = list
        return list
    }

    @SuppressLint("MissingPermission")
    fun connect(address: String, hasPermission: Boolean) {
        if (!hasPermission) {
            _telemetry.update {
                it.copy(
                    connectionState = ObdConnectionState.DISCONNECTED,
                    lastError = "Permissão Bluetooth não concedida"
                )
            }
            return
        }

        targetMacAddress = address
        autoReconnectEnabled = true
        connectionJob?.cancel()
        closeSocketQuietly()

        connectionJob = scope.launch {
            while (isActive && autoReconnectEnabled) {
                val adapter = getBluetoothAdapter()
                if (adapter == null || !adapter.isEnabled) {
                    _telemetry.update {
                        it.copy(
                            connectionState = ObdConnectionState.DISCONNECTED,
                            lastError = "Bluetooth desligado na central"
                        )
                    }
                    delay(RECONNECT_DELAY_MS)
                    continue
                }

                val device = runCatching { adapter.getRemoteDevice(address) }.getOrNull()
                if (device == null) {
                    _telemetry.update {
                        it.copy(
                            connectionState = ObdConnectionState.DISCONNECTED,
                            lastError = "Adaptador não encontrado"
                        )
                    }
                    break
                }

                _telemetry.update {
                    it.copy(
                        connectionState = ObdConnectionState.CONNECTING,
                        connectedDeviceName = device.name ?: "ELM327",
                        connectedDeviceAddress = address,
                        lastError = null
                    )
                }

                try {
                    adapter.cancelDiscovery()
                    val socket = device.createRfcommSocketToServiceRecord(SPP_UUID)
                    socket.connect()

                    activeSocket = socket
                    activeInput = socket.inputStream
                    activeOutput = socket.outputStream

                    initializeElm327()

                    _telemetry.update {
                        it.copy(
                            connectionState = ObdConnectionState.CONNECTED,
                            lastError = null
                        )
                    }

                    runTelemetryLoop(socket)
                } catch (e: IOException) {
                    closeSocketQuietly()
                    if (!autoReconnectEnabled || !isActive) break
                    _telemetry.update {
                        it.copy(
                            connectionState = ObdConnectionState.RECONNECTING,
                            lastError = "Conexão perdida, reconectando..."
                        )
                    }
                    delay(RECONNECT_DELAY_MS)
                }
            }
        }
    }

    fun disconnect() {
        autoReconnectEnabled = false
        targetMacAddress = null
        connectionJob?.cancel()
        connectionJob = null
        closeSocketQuietly()
        _telemetry.update {
            it.copy(
                connectionState = ObdConnectionState.DISCONNECTED,
                lastError = null
            )
        }
    }

    suspend fun readDtcCodes(): List<DtcFaultCode> = withContext(Dispatchers.IO) {
        val raw = ioMutex.withLock {
            sendAtOrObdCommand("03")
        } ?: return@withContext emptyList()

        val parsed = parseMode03Dtcs(raw)
        _telemetry.update { it.copy(dtcCodes = parsed) }
        parsed
    }

    suspend fun clearDtcCodes(): Boolean = withContext(Dispatchers.IO) {
        val raw = ioMutex.withLock {
            sendAtOrObdCommand("04")
        } ?: return@withContext false

        val ok = raw.uppercase().contains("44") || raw.uppercase().contains("OK")
        if (ok) {
            _telemetry.update { it.copy(dtcCodes = emptyList()) }
        }
        ok
    }

    private suspend fun initializeElm327() {
        ioMutex.withLock {
            val initSequence = listOf("ATZ", "ATE0", "ATL0", "ATS0", "ATH0", "ATSP0")
            for (cmd in initSequence) {
                sendAtOrObdCommand(cmd)
                delay(160L)
            }
        }
    }

    private suspend fun runTelemetryLoop(socket: BluetoothSocket) {
        var cycle = 0
        while (scope.isActive && autoReconnectEnabled && socket.isConnected) {
            val rpm = queryPidBytes("010C")?.let { bytes ->
                if (bytes.size >= 2) ((bytes[0] * 256) + bytes[1]) / 4 else null
            }
            val speed = queryPidBytes("010D")?.firstOrNull()
            val load = queryPidBytes("0104")?.firstOrNull()?.let { (it * 100) / 255 }

            var coolant = _telemetry.value.coolantTempC
            var intake = _telemetry.value.intakeTempC
            var voltage = _telemetry.value.batteryVoltage
            var maf = _telemetry.value.mafGramsPerSec
            var mapKpa = _telemetry.value.mapKpa

            if (cycle % 3 == 0) {
                maf = queryPidBytes("0110")?.let { bytes ->
                    if (bytes.size >= 2) ((bytes[0] * 256) + bytes[1]) / 100f else null
                } ?: maf
                if (maf == null) {
                    mapKpa = queryPidBytes("010B")?.firstOrNull() ?: mapKpa
                }
            }

            if (cycle % 6 == 0) {
                queryPidBytes("0105")?.firstOrNull()?.let { coolant = it - 40 }
                queryPidBytes("010F")?.firstOrNull()?.let { intake = it - 40 }
            }

            if (cycle % 10 == 0) {
                queryBatteryVoltageAtrv()?.let { voltage = it }
            }

            _telemetry.update { current ->
                current.copy(
                    connectionState = ObdConnectionState.CONNECTED,
                    rpm = rpm ?: current.rpm,
                    vehicleSpeedKmh = speed ?: current.vehicleSpeedKmh,
                    engineLoadPercent = load ?: current.engineLoadPercent,
                    coolantTempC = coolant,
                    intakeTempC = intake,
                    batteryVoltage = voltage,
                    mafGramsPerSec = maf,
                    mapKpa = mapKpa
                )
            }

            cycle++
            delay(140L)
        }
    }

    private suspend fun queryPidBytes(pid: String): List<Int>? = ioMutex.withLock {
        val raw = sendAtOrObdCommand(pid) ?: return null
        val clean = raw.replace("\\\\s+".toRegex(), "").uppercase()
        if (clean.contains("NODATA") || clean.contains("ERROR") || clean.contains("UNABLE")) {
            return null
        }

        val expectedHeader = "41" + pid.substring(2, 4)
        val headerIdx = clean.indexOf(expectedHeader)
        if (headerIdx < 0) return null

        val payload = clean.substring(headerIdx + 4)
        val bytes = mutableListOf<Int>()
        var i = 0
        while (i + 1 < payload.length && bytes.size < 4) {
            val byteVal = payload.substring(i, i + 2).toIntOrNull(16) ?: break
            bytes += byteVal
            i += 2
        }
        return bytes
    }

    private suspend fun queryBatteryVoltageAtrv(): Float? = ioMutex.withLock {
        val raw = sendAtOrObdCommand("ATRV") ?: return null
        val match = Regex("""(\\d{1,2}[.,]\\d)""").find(raw) ?: return null
        return match.value.replace(',', '.').toFloatOrNull()
    }

    private fun sendAtOrObdCommand(command: String): String? {
        val input = activeInput ?: return null
        val output = activeOutput ?: return null

        while (input.available() > 0) {
            input.read()
        }

        output.write("$command\\r".toByteArray(Charsets.US_ASCII))
        output.flush()

        val sb = StringBuilder()
        val deadline = System.currentTimeMillis() + COMMAND_TIMEOUT_MS
        val buffer = ByteArray(128)

        while (System.currentTimeMillis() < deadline) {
            if (input.available() > 0) {
                val read = input.read(buffer)
                if (read > 0) {
                    val chunk = String(buffer, 0, read, Charsets.US_ASCII)
                    sb.append(chunk)
                    if (chunk.contains('>')) {
                        return sb.toString()
                    }
                }
            } else {
                Thread.sleep(15L)
            }
        }
        return if (sb.isNotEmpty()) sb.toString() else null
    }

    private fun parseMode03Dtcs(rawResponse: String): List<DtcFaultCode> {
        val clean = rawResponse.replace("\\\\s+".toRegex(), "").uppercase()
        if (clean.contains("NODATA")) return emptyList()
        val headerIdx = clean.indexOf("43")
        if (headerIdx < 0) return emptyList()

        val data = clean.substring(headerIdx + 2)
        val codes = mutableListOf<DtcFaultCode>()
        var i = 0
        while (i + 3 < data.length) {
            val hexPair = data.substring(i, i + 4)
            i += 4
            if (hexPair == "0000") continue
            val firstByte = hexPair.substring(0, 2).toIntOrNull(16) ?: continue
            val prefixChar = when ((firstByte shr 6) and 0x03) {
                0 -> 'P'
                1 -> 'C'
                2 -> 'B'
                else -> 'U'
            }
            val secondDigit = (firstByte shr 4) and 0x03
            val rest = hexPair.substring(1)
            val dtcCode = "$prefixChar$secondDigit$rest"
            if (codes.none { it.code == dtcCode }) {
                codes += DtcFaultCode(
                    code = dtcCode,
                    descriptionPtBr = translateDtcToPortuguese(dtcCode)
                )
            }
        }
        return codes
    }

    private fun translateDtcToPortuguese(code: String): String = when (code) {
        "P0100", "P0101", "P0102" -> "Sensor de fluxo de ar (MAF) fora da faixa"
        "P0105", "P0106", "P0107" -> "Sensor de pressão absoluta (MAP) com falha"
        "P0110", "P0112", "P0113" -> "Sensor de temperatura do ar de admissão (IAT)"
        "P0115", "P0116", "P0117", "P0118" -> "Sensor de temperatura do líquido de arrefecimento"
        "P0120", "P0121", "P0122" -> "Sensor de posição da borboleta (TPS)"
        "P0130", "P0131", "P0132", "P0134" -> "Sonda Lambda (Banco 1 Sensor 1)"
        "P0171" -> "Mistura ar/combustível muito pobre"
        "P0172" -> "Mistura ar/combustível muito rica"
        "P0300" -> "Falha de ignição aleatória em múltiplos cilindros"
        "P0301" -> "Falha de ignição detectada no cilindro 1"
        "P0302" -> "Falha de ignição detectada no cilindro 2"
        "P0303" -> "Falha de ignição detectada no cilindro 3"
        "P0304" -> "Falha de ignição detectada no cilindro 4"
        "P0335" -> "Sensor de rotação do virabrequim (CKP)"
        "P0340" -> "Sensor de fase do comando de válvulas (CMP)"
        "P0420" -> "Eficiência do catalisador abaixo do limite"
        "P0500" -> "Sensor de velocidade do veículo (VSS)"
        "P0505" -> "Atuador de marcha lenta (IAC)"
        "P0562" -> "Tensão do sistema / bateria abaixo do normal"
        else -> "Código de falha genérico da ECU ($code)"
    }

    private fun closeSocketQuietly() {
        runCatching { activeInput?.close() }
        runCatching { activeOutput?.close() }
        runCatching { activeSocket?.close() }
        activeInput = null
        activeOutput = null
        activeSocket = null
    }

    private fun getBluetoothAdapter(): BluetoothAdapter? {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            (context.getSystemService(Context.BLUETOOTH_SERVICE) as? BluetoothManager)?.adapter
        } else {
            @Suppress("DEPRECATION")
            BluetoothAdapter.getDefaultAdapter()
        }
    }
}`
    },
    {
      id: 'trip-computer-manager',
      name: 'TripComputerManager.kt',
      path: 'app/src/main/java/com/garagem/launcher/hardware/TripComputerManager.kt',
      category: 'Hardware & Trip',
      language: 'kotlin',
      summary: 'Computador de Bordo em tempo real com distância, tempo ativo, velocidade média, consumo MAF/MAP/GPS e custo em R$.',
      code: `package com.garagem.launcher.hardware

import com.garagem.launcher.model.FuelType
import com.garagem.launcher.model.TripSummaryState
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlin.math.max

class TripComputerManager {

    private val _tripState = MutableStateFlow(TripSummaryState())
    val tripState: StateFlow<TripSummaryState> = _tripState.asStateFlow()

    private var lastTickMs: Long = 0L
    private var accumulatedDistanceKm: Double = 0.0
    private var accumulatedDrivingMs: Long = 0L
    private var accumulatedFuelLiters: Double = 0.0

    fun onTelemetryTick(
        speedKmh: Int,
        rpm: Int,
        engineLoadPercent: Int,
        mafGramsPerSec: Float?,
        mapKpa: Int?,
        intakeTempC: Int,
        usingObd: Boolean,
        displacementLiters: Float,
        fuelType: FuelType,
        fuelPriceBrl: Float
    ) {
        val now = System.currentTimeMillis()
        if (lastTickMs == 0L) {
            lastTickMs = now
            return
        }

        val deltaMs = (now - lastTickMs).coerceIn(0L, 5000L)
        lastTickMs = now
        val deltaHours = deltaMs / 3_600_000.0
        val deltaSeconds = deltaMs / 1000.0

        val isMoving = speedKmh >= 2
        if (isMoving) {
            accumulatedDrivingMs += deltaMs
            accumulatedDistanceKm += speedKmh * deltaHours
        }

        val instantLitersPerHour = estimateFuelFlowLitersPerHour(
            speedKmh = speedKmh,
            rpm = rpm,
            engineLoadPercent = engineLoadPercent,
            mafGramsPerSec = mafGramsPerSec,
            mapKpa = mapKpa,
            intakeTempC = intakeTempC,
            usingObd = usingObd,
            displacementLiters = displacementLiters,
            fuelType = fuelType
        )

        if (isMoving || (usingObd && rpm >= 400)) {
            accumulatedFuelLiters += (instantLitersPerHour / 3600.0) * deltaSeconds
        }

        val instantKmPerL = if (isMoving && instantLitersPerHour > 0.05) {
            (speedKmh / instantLitersPerHour).toFloat().coerceIn(2.0f, 35.0f)
        } else {
            0f
        }

        val avgKmPerL = if (accumulatedFuelLiters > 0.002 && accumulatedDistanceKm > 0.02) {
            (accumulatedDistanceKm / accumulatedFuelLiters).toFloat().coerceIn(2.0f, 35.0f)
        } else {
            0f
        }

        val drivingSeconds = accumulatedDrivingMs / 1000L
        val avgSpeed = if (drivingSeconds > 0L) {
            (accumulatedDistanceKm / (drivingSeconds / 3600.0)).toFloat()
        } else {
            0f
        }

        val totalCostBrl = (accumulatedFuelLiters * fuelPriceBrl).toFloat()

        _tripState.update {
            TripSummaryState(
                distanceKm = accumulatedDistanceKm.toFloat(),
                activeDrivingSeconds = drivingSeconds,
                averageSpeedKmh = avgSpeed,
                instantKmPerLiter = instantKmPerL,
                averageKmPerLiter = avgKmPerL,
                fuelConsumedLiters = accumulatedFuelLiters.toFloat(),
                estimatedCostBrl = totalCostBrl,
                usingObdSource = usingObd
            )
        }
    }

    fun resetTrip() {
        lastTickMs = System.currentTimeMillis()
        accumulatedDistanceKm = 0.0
        accumulatedDrivingMs = 0L
        accumulatedFuelLiters = 0.0
        _tripState.value = TripSummaryState()
    }

    private fun estimateFuelFlowLitersPerHour(
        speedKmh: Int,
        rpm: Int,
        engineLoadPercent: Int,
        mafGramsPerSec: Float?,
        mapKpa: Int?,
        intakeTempC: Int,
        usingObd: Boolean,
        displacementLiters: Float,
        fuelType: FuelType
    ): Double {
        if (usingObd && mafGramsPerSec != null && mafGramsPerSec > 0.2f) {
            val fuelGramsPerSec = mafGramsPerSec / fuelType.stoichAfr
            val fuelGramsPerHour = fuelGramsPerSec * 3600.0
            return fuelGramsPerHour / (fuelType.densityKgPerLiter * 1000.0)
        }

        if (usingObd && mapKpa != null && rpm > 350) {
            val tempKelvin = max(230f, intakeTempC + 273.15f)
            val volumetricEfficiency = 0.80f
            val airMassFlow = ((rpm * mapKpa * displacementLiters * volumetricEfficiency) / (120f * 0.287f * tempKelvin))
            val fuelGramsPerSec = airMassFlow / fuelType.stoichAfr
            val litersPerHour = (fuelGramsPerSec * 3.6) / fuelType.densityKgPerLiter
            return litersPerHour.coerceIn(0.45, 28.0)
        }

        // Estimativa via GPS + Cilindrada quando OBD2 estiver desconectado
        if (speedKmh < 2) {
            return if (usingObd && rpm >= 400) 0.75 * (displacementLiters / 1.6) else 0.0
        }

        val displacementFactor = (1.6 / max(0.8f, displacementLiters)).coerceIn(0.65, 1.35)
        val aeroPenalty = if (speedKmh > 95) 0.86 else 1.0
        val estimatedKmPerL = fuelType.baseReferenceKmPerLiter * displacementFactor * aeroPenalty *
            (1.0 + (engineLoadPercent.coerceIn(0, 100) * -0.002))
        return speedKmh / max(4.0, estimatedKmPerL)
    }
}`
    },
    {
      id: 'media-bridge',
      name: 'SystemMediaBridge.kt',
      path: 'app/src/main/java/com/garagem/launcher/hardware/SystemMediaBridge.kt',
      category: 'Hardware & Trip',
      language: 'kotlin',
      summary: 'Controle universal de áudio, volume e sessão de mídia integrado ao Android.',
      code: `package com.garagem.launcher.hardware

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.media.AudioManager
import android.os.Build
import android.os.SystemClock
import android.provider.Settings
import android.view.KeyEvent
import com.garagem.launcher.model.MediaPlaybackState
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update

class SystemMediaBridge(private val context: Context) {

    private val audioManager =
        context.getSystemService(Context.AUDIO_SERVICE) as AudioManager

    private val _mediaState = MutableStateFlow(readInitialState())
    val mediaState: StateFlow<MediaPlaybackState> = _mediaState.asStateFlow()

    private var registered = false

    private val receiver = object : BroadcastReceiver() {
        override fun onReceive(ctx: Context?, intent: Intent?) {
            if (intent == null) return
            val track = intent.getStringExtra("track")
            val artist = intent.getStringExtra("artist")
            val playing = intent.getBooleanExtra("playing", audioManager.isMusicActive)
            _mediaState.update { current ->
                current.copy(
                    hasNotificationPermission = true,
                    title = track?.takeIf { it.isNotBlank() } ?: current.title,
                    subtitle = artist?.takeIf { it.isNotBlank() } ?: current.subtitle,
                    isPlaying = playing
                )
            }
        }
    }

    fun startListening() {
        if (registered) return
        registered = true
        val filter = IntentFilter().apply {
            addAction("com.android.music.metachanged")
            addAction("com.spotify.music.metadatachanged")
            addAction("com.spotify.music.playbackstatechanged")
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            context.registerReceiver(receiver, filter, Context.RECEIVER_EXPORTED)
        } else {
            @Suppress("DEPRECATION")
            context.registerReceiver(receiver, filter)
        }
        syncPermissionStatus()
    }

    fun stopListening() {
        if (!registered) return
        registered = false
        try {
            context.unregisterReceiver(receiver)
        } catch (_: IllegalArgumentException) {
        }
    }

    fun syncPermissionStatus() {
        val enabledListeners = Settings.Secure.getString(
            context.contentResolver,
            "enabled_notification_listeners"
        ).orEmpty()
        val granted = enabledListeners.contains(context.packageName)
        _mediaState.update { current ->
            if (granted && !current.hasNotificationPermission) {
                current.copy(
                    hasNotificationPermission = true,
                    title = "Áudio da Central",
                    subtitle = "Spotify · YouTube Music · BT"
                )
            } else {
                current.copy(hasNotificationPermission = granted || current.hasNotificationPermission)
            }
        }
    }

    fun enableControlSession() {
        _mediaState.update {
            it.copy(
                hasNotificationPermission = true,
                title = "Áudio da Central",
                subtitle = "Spotify · YouTube Music · BT"
            )
        }
    }

    fun togglePlayPause() {
        sendMediaKey(KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE)
        _mediaState.update {
            it.copy(
                hasNotificationPermission = true,
                title = if (it.hasNotificationPermission) it.title else "Reprodução Ativa",
                subtitle = if (it.hasNotificationPermission) it.subtitle else "Mídia do Sistema",
                isPlaying = !it.isPlaying
            )
        }
    }

    fun nextTrack() {
        sendMediaKey(KeyEvent.KEYCODE_MEDIA_NEXT)
        _mediaState.update { it.copy(isPlaying = true) }
    }

    fun previousTrack() {
        sendMediaKey(KeyEvent.KEYCODE_MEDIA_PREVIOUS)
        _mediaState.update { it.copy(isPlaying = true) }
    }

    fun volumeUp() {
        audioManager.adjustStreamVolume(AudioManager.STREAM_MUSIC, AudioManager.ADJUST_RAISE, AudioManager.FLAG_SHOW_UI)
        refreshVolume()
    }

    fun volumeDown() {
        audioManager.adjustStreamVolume(AudioManager.STREAM_MUSIC, AudioManager.ADJUST_LOWER, AudioManager.FLAG_SHOW_UI)
        refreshVolume()
    }

    private fun refreshVolume() {
        val cur = audioManager.getStreamVolume(AudioManager.STREAM_MUSIC)
        val max = audioManager.getStreamMaxVolume(AudioManager.STREAM_MUSIC).coerceAtLeast(1)
        _mediaState.update { it.copy(volumeLevel = cur, volumeMax = max) }
    }

    private fun readInitialState(): MediaPlaybackState {
        val cur = audioManager.getStreamVolume(AudioManager.STREAM_MUSIC)
        val max = audioManager.getStreamMaxVolume(AudioManager.STREAM_MUSIC).coerceAtLeast(1)
        return MediaPlaybackState(
            volumeLevel = cur,
            volumeMax = max,
            isPlaying = audioManager.isMusicActive
        )
    }

    private fun sendMediaKey(keyCode: Int) {
        val now = SystemClock.uptimeMillis()
        audioManager.dispatchMediaKeyEvent(KeyEvent(now, now, KeyEvent.ACTION_DOWN, keyCode, 0))
        audioManager.dispatchMediaKeyEvent(KeyEvent(now, now, KeyEvent.ACTION_UP, keyCode, 0))
    }
}`
    },
    {
      id: 'viewmodel',
      name: 'GpsAndWeatherViewModel.kt',
      path: 'app/src/main/java/com/garagem/launcher/viewmodel/GpsAndWeatherViewModel.kt',
      category: 'ViewModel & Model',
      language: 'kotlin',
      summary: 'ViewModel central integrando FusedLocation, Open-Meteo, ObdBluetoothManager, TripComputerManager, SplashIntro e SharedPreferences.',
      code: `package com.garagem.launcher.viewmodel

import android.annotation.SuppressLint
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.drawable.BitmapDrawable
import android.graphics.drawable.Drawable
import android.location.Location
import android.os.Looper
import androidx.compose.ui.graphics.asImageBitmap
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.garagem.launcher.hardware.ObdBluetoothManager
import com.garagem.launcher.hardware.SystemMediaBridge
import com.garagem.launcher.hardware.TripComputerManager
import com.garagem.launcher.model.FuelType
import com.garagem.launcher.model.InstalledAppInfo
import com.garagem.launcher.model.LauncherUiState
import com.garagem.launcher.model.NeonAccentPreset
import com.garagem.launcher.model.ObdConnectionState
import com.garagem.launcher.model.QuickShortcut
import com.garagem.launcher.model.WeatherState
import com.garagem.launcher.model.defaultQuickShortcuts
import com.google.android.gms.location.LocationCallback
import com.google.android.gms.location.LocationRequest
import com.google.android.gms.location.LocationResult
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import kotlin.math.roundToInt

class GpsAndWeatherViewModel(private val appContext: Context) : ViewModel() {

    private val prefs = appContext.getSharedPreferences("gol_cockpit_prefs", Context.MODE_PRIVATE)
    private val fusedLocationClient = LocationServices.getFusedLocationProviderClient(appContext)
    private val mediaBridge = SystemMediaBridge(appContext)
    private val obdManager = ObdBluetoothManager(appContext)
    private val tripComputer = TripComputerManager()

    private val _uiState = MutableStateFlow(loadInitialUiState())
    val uiState: StateFlow<LauncherUiState> = _uiState.asStateFlow()

    private var lastLat: Double? = null
    private var lastLon: Double? = null
    private var lastWeatherFetchMs: Long = 0L
    private var isLocationRegistered = false

    private val locationCallback = object : LocationCallback() {
        override fun onLocationResult(result: LocationResult) {
            result.lastLocation?.let(::handleNewLocation)
        }
    }

    init {
        mediaBridge.startListening()
        startClockTicker()
        startTripTicker()

        viewModelScope.launch {
            mediaBridge.mediaState.collect { media ->
                _uiState.update { it.copy(media = media) }
            }
        }
        viewModelScope.launch {
            obdManager.telemetry.collect { obd ->
                _uiState.update { it.copy(obd = obd) }
            }
        }
        viewModelScope.launch {
            obdManager.pairedDevices.collect { devices ->
                _uiState.update { it.copy(pairedDevices = devices) }
            }
        }
        viewModelScope.launch {
            tripComputer.tripState.collect { trip ->
                _uiState.update { it.copy(trip = trip) }
            }
        }
    }

    private fun startClockTicker() {
        viewModelScope.launch {
            val ptBr = Locale("pt", "BR")
            val timeFormat = SimpleDateFormat("H:mm", ptBr)
            val dateFormat = SimpleDateFormat("EEEE, dd 'de' MMMM", ptBr)
            while (isActive) {
                val now = Date()
                _uiState.update {
                    it.copy(
                        clockText = timeFormat.format(now),
                        dateText = dateFormat.format(now).replaceFirstChar { ch -> ch.uppercase() }
                    )
                }
                delay(15_000L)
            }
        }
    }

    private fun startTripTicker() {
        viewModelScope.launch {
            while (isActive) {
                val snapshot = _uiState.value
                val usingObd = snapshot.obd.connectionState == ObdConnectionState.CONNECTED
                tripComputer.onTelemetryTick(
                    speedKmh = snapshot.activeSpeedKmh,
                    rpm = snapshot.obd.rpm,
                    engineLoadPercent = snapshot.obd.engineLoadPercent,
                    mafGramsPerSec = snapshot.obd.mafGramsPerSec,
                    mapKpa = snapshot.obd.mapKpa,
                    intakeTempC = snapshot.obd.intakeTempC,
                    usingObd = usingObd,
                    displacementLiters = snapshot.engineDisplacementLiters,
                    fuelType = snapshot.fuelType,
                    fuelPriceBrl = snapshot.fuelPriceBrl
                )
                delay(1000L)
            }
        }
    }

    fun startBackgroundServices(hasLocationPermission: Boolean, hasBluetoothPermission: Boolean) {
        onPermissionsUpdated(hasLocationPermission, hasBluetoothPermission)
        reconnectLastObdIfNeeded()
    }

    fun onPermissionsUpdated(hasLocation: Boolean, hasBluetooth: Boolean) {
        _uiState.update {
            it.copy(hasLocationPermission = hasLocation, hasBluetoothPermission = hasBluetooth)
        }
        if (hasLocation) startLocationUpdates(true)
        if (hasBluetooth) obdManager.refreshPairedDevices(true)
    }

    @SuppressLint("MissingPermission")
    fun startLocationUpdates(hasPermission: Boolean) {
        _uiState.update { it.copy(hasLocationPermission = hasPermission) }
        if (!hasPermission || isLocationRegistered) return

        val request = LocationRequest.Builder(Priority.PRIORITY_HIGH_ACCURACY, 750L)
            .setMinUpdateIntervalMillis(400L)
            .setWaitForAccurateLocation(false)
            .build()

        try {
            fusedLocationClient.requestLocationUpdates(request, locationCallback, Looper.getMainLooper())
            isLocationRegistered = true
            fusedLocationClient.lastLocation.addOnSuccessListener { loc ->
                if (loc != null) handleNewLocation(loc)
            }
        } catch (_: SecurityException) {
            isLocationRegistered = false
        }
    }

    fun stopLocationUpdates() {
        if (!isLocationRegistered) return
        fusedLocationClient.removeLocationUpdates(locationCallback)
        isLocationRegistered = false
    }

    private fun handleNewLocation(location: Location) {
        val rawKmh = if (location.hasSpeed()) location.speed * 3.6f else 0f
        val cleanSpeed = if (rawKmh < 2.0f) 0 else rawKmh.roundToInt()

        lastLat = location.latitude
        lastLon = location.longitude

        _uiState.update { it.copy(gpsSpeedKmh = cleanSpeed, hasGpsFix = true) }

        val now = System.currentTimeMillis()
        if (now - lastWeatherFetchMs > 15 * 60 * 1000L) {
            fetchOpenMeteoWeather(location.latitude, location.longitude)
        }
    }

    fun refreshWeatherNow() {
        fetchOpenMeteoWeather(lastLat ?: -23.5505, lastLon ?: -46.6333)
    }

    private fun fetchOpenMeteoWeather(latitude: Double, longitude: Double) {
        lastWeatherFetchMs = System.currentTimeMillis()
        viewModelScope.launch {
            _uiState.update { it.copy(weather = it.weather.copy(isLoading = true)) }
            val weather = withContext(Dispatchers.IO) {
                runCatching {
                    val url =
                        "https://api.open-meteo.com/v1/forecast?latitude=\$latitude&longitude=\$longitude&current=temperature_2m,weather_code&timezone=auto"
                    val conn = (URL(url).openConnection() as HttpURLConnection).apply {
                        requestMethod = "GET"
                        connectTimeout = 6000
                        readTimeout = 6000
                    }
                    try {
                        val json = JSONObject(conn.inputStream.bufferedReader().use { it.readText() })
                        val cur = json.getJSONObject("current")
                        WeatherState(
                            temperatureCelsius = cur.getDouble("temperature_2m").roundToInt(),
                            conditionLabel = mapWmoToPtBr(cur.getInt("weather_code")),
                            isLoading = false
                        )
                    } finally {
                        conn.disconnect()
                    }
                }.getOrElse {
                    _uiState.value.weather.copy(isLoading = false)
                }
            }
            _uiState.update { it.copy(weather = weather) }
        }
    }

    fun refreshPairedBluetoothDevices() {
        obdManager.refreshPairedDevices(_uiState.value.hasBluetoothPermission)
    }

    fun connectObdDevice(address: String) {
        prefs.edit().putString("last_obd_mac", address).apply()
        obdManager.connect(address, _uiState.value.hasBluetoothPermission)
    }

    fun reconnectLastObdIfNeeded() {
        val state = _uiState.value
        val lastMac = prefs.getString("last_obd_mac", null)
        if (!lastMac.isNullOrBlank() &&
            state.hasBluetoothPermission &&
            state.obd.connectionState == ObdConnectionState.DISCONNECTED
        ) {
            obdManager.connect(lastMac, true)
        }
    }

    fun disconnectObd() {
        prefs.edit().remove("last_obd_mac").apply()
        obdManager.disconnect()
    }

    fun readDtcCodes() {
        viewModelScope.launch { obdManager.readDtcCodes() }
    }

    fun clearDtcCodes() {
        viewModelScope.launch { obdManager.clearDtcCodes() }
    }

    fun triggerSplashIfEnabled() {
        if (_uiState.value.splashAnimationEnabled) {
            _uiState.update { it.copy(showSplashIntro = true) }
        }
    }

    fun forceReplaySplash() {
        _uiState.update { it.copy(showSplashIntro = true, isSettingsOpen = false) }
    }

    fun dismissSplashIntro() {
        _uiState.update { it.copy(showSplashIntro = false) }
    }

    fun resetTrip() {
        tripComputer.resetTrip()
    }

    fun refreshInstalledApps() {
        viewModelScope.launch {
            val apps = withContext(Dispatchers.IO) {
                val pm = appContext.packageManager
                val intent = Intent(Intent.ACTION_MAIN, null).apply {
                    addCategory(Intent.CATEGORY_LAUNCHER)
                }
                pm.queryIntentActivities(intent, 0)
                    .filter { it.activityInfo.packageName != appContext.packageName }
                    .distinctBy { it.activityInfo.packageName }
                    .map { info ->
                        InstalledAppInfo(
                            label = info.loadLabel(pm).toString(),
                            packageName = info.activityInfo.packageName,
                            icon = runCatching {
                                drawableToBitmap(info.loadIcon(pm)).asImageBitmap()
                            }.getOrNull()
                        )
                    }
                    .sortedBy { it.label.lowercase() }
            }
            _uiState.update { it.copy(installedApps = apps) }
        }
    }

    fun openAppDrawer(replacingSlotIndex: Int?) {
        _uiState.update {
            it.copy(
                isAppDrawerOpen = true,
                replacingSlotIndex = replacingSlotIndex,
                isSettingsOpen = false,
                isObdDialogOpen = false,
                isTripDialogOpen = false
            )
        }
    }

    fun closeAppDrawer() = _uiState.update { it.copy(isAppDrawerOpen = false, replacingSlotIndex = null) }
    fun openSettingsDialog() = _uiState.update { it.copy(isSettingsOpen = true, isAppDrawerOpen = false, isObdDialogOpen = false, isTripDialogOpen = false) }
    fun closeSettingsDialog() = _uiState.update { it.copy(isSettingsOpen = false) }
    fun openObdDialog() {
        refreshPairedBluetoothDevices()
        _uiState.update { it.copy(isObdDialogOpen = true, isAppDrawerOpen = false, isSettingsOpen = false, isTripDialogOpen = false) }
    }
    fun closeObdDialog() = _uiState.update { it.copy(isObdDialogOpen = false) }
    fun openTripDialog() = _uiState.update { it.copy(isTripDialogOpen = true, isAppDrawerOpen = false, isSettingsOpen = false, isObdDialogOpen = false) }
    fun closeTripDialog() = _uiState.update { it.copy(isTripDialogOpen = false) }

    fun dismissAllOverlays() {
        _uiState.update {
            it.copy(
                isAppDrawerOpen = false,
                replacingSlotIndex = null,
                isSettingsOpen = false,
                isObdDialogOpen = false,
                isTripDialogOpen = false
            )
        }
    }

    fun assignQuickShortcut(slotIndex: Int, app: InstalledAppInfo) {
        val updated = _uiState.value.shortcuts.map { s ->
            if (s.slotIndex == slotIndex) {
                QuickShortcut(slotIndex, app.label.uppercase(), app.packageName)
            } else {
                s
            }
        }
        prefs.edit()
            .putString("shortcut_label_\$slotIndex", app.label.uppercase())
            .putString("shortcut_pkg_\$slotIndex", app.packageName)
            .apply()

        _uiState.update { it.copy(shortcuts = updated, isAppDrawerOpen = false, replacingSlotIndex = null) }
    }

    fun updateFullConfig(
        carName: String,
        speedLimitKmh: Int,
        accentPreset: NeonAccentPreset,
        displacementLiters: Float,
        fuelType: FuelType,
        fuelPriceBrl: Float,
        splashEnabled: Boolean
    ) {
        val cleanName = carName.trim().ifBlank { "${safeCarName}" }
        val limit = speedLimitKmh.coerceIn(30, 240)
        val disp = displacementLiters.coerceIn(0.8f, 6.0f)
        val price = fuelPriceBrl.coerceIn(1.0f, 15.0f)

        prefs.edit()
            .putString("car_name", cleanName)
            .putInt("speed_limit", limit)
            .putString("accent_preset", accentPreset.name)
            .putFloat("displacement", disp)
            .putString("fuel_type", fuelType.name)
            .putFloat("fuel_price", price)
            .putBoolean("splash_enabled", splashEnabled)
            .apply()

        _uiState.update {
            it.copy(
                carName = cleanName,
                speedLimitKmh = limit,
                accentPreset = accentPreset,
                engineDisplacementLiters = disp,
                fuelType = fuelType,
                fuelPriceBrl = price,
                splashAnimationEnabled = splashEnabled,
                isSettingsOpen = false
            )
        }
    }

    fun cycleDimmer() {
        _uiState.update {
            val next = when (it.dimmerAlpha) {
                0f -> 0.30f
                0.30f -> 0.58f
                else -> 0f
            }
            it.copy(dimmerAlpha = next)
        }
    }

    fun syncMediaPermissionStatus() = mediaBridge.syncPermissionStatus()
    fun enableDemoMediaControl() = mediaBridge.enableControlSession()
    fun mediaPrevious() = mediaBridge.previousTrack()
    fun mediaPlayPause() = mediaBridge.togglePlayPause()
    fun mediaNext() = mediaBridge.nextTrack()
    fun volumeUp() = mediaBridge.volumeUp()
    fun volumeDown() = mediaBridge.volumeDown()

    override fun onCleared() {
        super.onCleared()
        stopLocationUpdates()
        mediaBridge.stopListening()
        obdManager.disconnect()
    }

    private fun loadInitialUiState(): LauncherUiState {
        val carName = prefs.getString("car_name", "${safeCarName}") ?: "${safeCarName}"
        val limit = prefs.getInt("speed_limit", ${speedLimit})
        val presetName = prefs.getString("accent_preset", NeonAccentPreset.${config.neonTheme.toUpperCase()}.name)
        val preset = runCatching { NeonAccentPreset.valueOf(presetName ?: "CYAN") }
            .getOrDefault(NeonAccentPreset.${config.neonTheme.toUpperCase()})
        val disp = prefs.getFloat("displacement", ${displacement}f)
        val fuelName = prefs.getString("fuel_type", FuelType.${config.fuelType}.name)
        val fuel = runCatching { FuelType.valueOf(fuelName ?: "GASOLINE") }.getOrDefault(FuelType.GASOLINE)
        val price = prefs.getFloat("fuel_price", ${fuelPrice}f)
        val splash = prefs.getBoolean("splash_enabled", ${config.splashEnabled})

        val shortcuts = defaultQuickShortcuts().map { def ->
            val label = prefs.getString("shortcut_label_\${def.slotIndex}", def.label) ?: def.label
            val pkg = prefs.getString("shortcut_pkg_\${def.slotIndex}", def.packageName) ?: def.packageName
            QuickShortcut(def.slotIndex, label, pkg)
        }

        return LauncherUiState(
            carName = carName,
            speedLimitKmh = limit,
            accentPreset = preset,
            engineDisplacementLiters = disp,
            fuelType = fuel,
            fuelPriceBrl = price,
            splashAnimationEnabled = splash,
            showSplashIntro = splash,
            shortcuts = shortcuts
        )
    }

    private fun drawableToBitmap(drawable: Drawable): Bitmap {
        if (drawable is BitmapDrawable && drawable.bitmap != null) return drawable.bitmap
        val w = drawable.intrinsicWidth.coerceAtLeast(96)
        val h = drawable.intrinsicHeight.coerceAtLeast(96)
        val bmp = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bmp)
        drawable.setBounds(0, 0, canvas.width, canvas.height)
        drawable.draw(canvas)
        return bmp
    }

    private fun mapWmoToPtBr(code: Int): String = when (code) {
        0 -> "Céu Limpo"
        1, 2 -> "Poucas Nuvens"
        3 -> "Nublado"
        45, 48 -> "Neblina"
        51, 53, 55 -> "Garoa"
        61, 63, 65 -> "Chuva"
        80, 81, 82 -> "Pancadas"
        95, 96, 99 -> "Tempestade"
        else -> "Tempo Estável"
    }
}

class GpsAndWeatherViewModelFactory(private val context: Context) : ViewModelProvider.Factory {
    @Suppress("UNCHECKED_CAST")
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        return GpsAndWeatherViewModel(context) as T
    }
}`
    },
    {
      id: 'splash-intro-overlay',
      name: 'SplashIntroOverlay.kt',
      path: 'app/src/main/java/com/garagem/launcher/ui/SplashIntroOverlay.kt',
      category: 'Compose UI',
      language: 'kotlin',
      summary: 'Animação de entrada cinematográfica de 2,5s: carro desliza da lateral para o centro, faróis piscam com brilho radial, linha neon acende e saudação é digitada.',
      code: `package com.garagem.launcher.ui

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.tween
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.garagem.launcher.R
import com.garagem.launcher.ui.theme.LocalGaragePalette
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlin.math.roundToInt

@Composable
fun SplashIntroOverlay(
    carName: String,
    onFinished: () -> Unit
) {
    val palette = LocalGaragePalette.current
    val fullGreeting = "BEM VINDO"

    val slideOffsetPx = remember { Animatable(-280f) }
    val carAlpha = remember { Animatable(0f) }
    val headlightFlash = remember { Animatable(0f) }
    val neonLineFraction = remember { Animatable(0f) }
    val overlayFadeOut = remember { Animatable(1f) }
    var visibleChars by remember { mutableIntStateOf(0) }

    LaunchedEffect(carName) {
        // 1. Carro desliza da lateral para o centro + fade-in (0 -> 950ms)
        val slideJob = launch {
            slideOffsetPx.animateTo(
                targetValue = 0f,
                animationSpec = tween(durationMillis = 950, easing = FastOutSlowInEasing)
            )
        }
        val alphaJob = launch {
            carAlpha.animateTo(
                targetValue = 1f,
                animationSpec = tween(durationMillis = 850)
            )
        }

        // 2. Animação de digitação do texto de boas-vindas
        val typingJob = launch {
            delay(250L)
            for (i in 1..fullGreeting.length) {
                visibleChars = i
                delay(42L)
            }
        }

        slideJob.join()
        alphaJob.join()

        // 3. Linha neon acende sob o carro + flash duplo nos faróis
        val neonJob = launch {
            neonLineFraction.animateTo(
                targetValue = 1f,
                animationSpec = tween(durationMillis = 550, easing = FastOutSlowInEasing)
            )
        }
        val flashJob = launch {
            headlightFlash.animateTo(1f, tween(130))
            headlightFlash.animateTo(0.15f, tween(110))
            headlightFlash.animateTo(0.95f, tween(140))
            headlightFlash.animateTo(0f, tween(320))
        }

        neonJob.join()
        flashJob.join()
        typingJob.join()

        // Aguarda fechando os 2,5 segundos totais e revela suavemente o painel
        delay(420L)
        overlayFadeOut.animateTo(0f, tween(280))
        onFinished()
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .alpha(overlayFadeOut.value)
            .background(
                Brush.verticalGradient(
                    colors = listOf(Color(0xFF04060B), Color(0xFF0A1020), Color(0xFF04060B))
                )
            )
    ) {
        // Imagem do carro deslizando para o centro
        Box(
            modifier = Modifier
                .align(Alignment.Center)
                .fillMaxWidth(0.68f)
                .height(310.dp)
                .offset { IntOffset(slideOffsetPx.value.roundToInt(), -14) }
                .alpha(carAlpha.value)
        ) {
            Image(
                painter = painterResource(id = R.drawable.meu_carro),
                contentDescription = carName,
                contentScale = ContentScale.Crop,
                modifier = Modifier.fillMaxSize()
            )

            // Brilho radial nos faróis + linha neon sob o carro
            Canvas(modifier = Modifier.fillMaxSize()) {
                val flashAlpha = headlightFlash.value
                if (flashAlpha > 0.01f) {
                    val leftHeadlight = Offset(size.width * 0.31f, size.height * 0.62f)
                    val rightHeadlight = Offset(size.width * 0.44f, size.height * 0.64f)
                    val glowRadius = size.width * 0.16f

                    listOf(leftHeadlight, rightHeadlight).forEach { center ->
                        drawCircle(
                            brush = Brush.radialGradient(
                                colors = listOf(
                                    Color.White.copy(alpha = 0.95f * flashAlpha),
                                    palette.neonSecondary.copy(alpha = 0.55f * flashAlpha),
                                    Color.Transparent
                                ),
                                center = center,
                                radius = glowRadius
                            ),
                            radius = glowRadius,
                            center = center
                        )
                    }
                }

                // Linha neon horizontal acendendo sob o carro
                val lineHalf = (size.width * 0.44f) * neonLineFraction.value
                if (lineHalf > 1f) {
                    val y = size.height * 0.91f
                    val midX = size.width * 0.5f
                    drawLine(
                        brush = Brush.horizontalGradient(
                            colors = listOf(Color.Transparent, palette.neonSecondary, Color.White, palette.neonSecondary, Color.Transparent),
                            startX = midX - lineHalf,
                            endX = midX + lineHalf
                        ),
                        start = Offset(midX - lineHalf, y),
                        end = Offset(midX + lineHalf, y),
                        strokeWidth = 4.dp.toPx()
                    )
                }
            }
        }

        // Texto de boas-vindas com digitação elegante
        Column(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(bottom = 52.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Text(
                text = fullGreeting.take(visibleChars),
                fontSize = 30.sp,
                fontWeight = FontWeight.Bold,
                color = palette.textPrimary,
                letterSpacing = 0.5.sp
            )
            Spacer(Modifier.height(2.dp))
            Text(
                text = "Inicializando GPS, OBD-II e áudio da central...",
                fontSize = 13.sp,
                color = palette.textSecondary
            )
        }

        // Botão discreto "Pular" no canto superior direito
        OutlinedButton(
            onClick = onFinished,
            modifier = Modifier
                .align(Alignment.TopEnd)
                .padding(24.dp)
                .height(48.dp)
                .width(110.dp),
            shape = RoundedCornerShape(12.dp),
            border = BorderStroke(1.dp, palette.borderGlow)
        ) {
            Text("Pular", color = palette.textSecondary, fontWeight = FontWeight.SemiBold)
        }
    }
}`
    },
    {
      id: 'dashboard-screen',
      name: 'DashboardScreen.kt',
      path: 'app/src/main/java/com/garagem/launcher/ui/DashboardScreen.kt',
      category: 'Compose UI',
      language: 'kotlin',
      summary: 'Painel completo com botão de status OBD2 no topo, arco RPM quando conectado, card compacto do Computador de Bordo, modal Drive Lab / Saúde e SplashIntroOverlay.',
      code: `package com.garagem.launcher.ui

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.combinedClickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.GenericShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Apps
import androidx.compose.material.icons.rounded.Bluetooth
import androidx.compose.material.icons.rounded.Build
import androidx.compose.material.icons.rounded.DirectionsCar
import androidx.compose.material.icons.rounded.Mic
import androidx.compose.material.icons.rounded.MusicNote
import androidx.compose.material.icons.rounded.Navigation
import androidx.compose.material.icons.rounded.Pause
import androidx.compose.material.icons.rounded.Place
import androidx.compose.material.icons.rounded.PlayArrow
import androidx.compose.material.icons.rounded.SkipNext
import androidx.compose.material.icons.rounded.SkipPrevious
import androidx.compose.material.icons.rounded.Speed
import androidx.compose.material.icons.rounded.Tune
import androidx.compose.material.icons.rounded.VolumeDown
import androidx.compose.material.icons.rounded.VolumeUp
import androidx.compose.material.icons.rounded.WbSunny
import androidx.compose.material.icons.rounded.Wifi
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Slider
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.garagem.launcher.R
import com.garagem.launcher.model.FuelType
import com.garagem.launcher.model.InstalledAppInfo
import com.garagem.launcher.model.LauncherUiState
import com.garagem.launcher.model.NeonAccentPreset
import com.garagem.launcher.model.ObdConnectionState
import com.garagem.launcher.model.QuickShortcut
import com.garagem.launcher.ui.theme.LocalGaragePalette
import com.garagem.launcher.ui.theme.premiumGlassCard
import com.garagem.launcher.ui.theme.premiumMetallicCard
import java.util.Locale

private val ParallelogramShape: Shape = GenericShape { size, _ ->
    val slant = size.width * 0.10f
    moveTo(slant, 0f)
    lineTo(size.width, 0f)
    lineTo(size.width - slant, size.height)
    lineTo(0f, size.height)
    close()
}

@Composable
fun DashboardScreen(
    state: LauncherUiState,
    onSkipSplash: () -> Unit,
    onReplaySplash: () -> Unit,
    onOpenDrawer: () -> Unit,
    onCloseDrawer: () -> Unit,
    onOpenSettings: () -> Unit,
    onCloseSettings: () -> Unit,
    onOpenObdDialog: () -> Unit,
    onCloseObdDialog: () -> Unit,
    onOpenTripDialog: () -> Unit,
    onCloseTripDialog: () -> Unit,
    onLaunchApp: (String) -> Boolean,
    onShortcutClick: (Int, QuickShortcut) -> Unit,
    onStartReplaceShortcut: (Int) -> Unit,
    onAssignShortcut: (Int, InstalledAppInfo) -> Unit,
    onVoiceCommand: () -> Unit,
    onVolumeDown: () -> Unit,
    onVolumeUp: () -> Unit,
    onMediaPrevious: () -> Unit,
    onMediaPlayPause: () -> Unit,
    onMediaNext: () -> Unit,
    onGrantMediaPermission: () -> Unit,
    onCycleDimmer: () -> Unit,
    onResetTrip: () -> Unit,
    onRefreshPairedDevices: () -> Unit,
    onConnectObdDevice: (String) -> Unit,
    onDisconnectObd: () -> Unit,
    onReadDtcCodes: () -> Unit,
    onClearDtcCodes: () -> Unit,
    onUpdateFullConfig: (String, Int, NeonAccentPreset, Float, FuelType, Float, Boolean) -> Unit,
    onRefreshWeather: () -> Unit,
    onOpenWifiSettings: () -> Unit,
    onOpenBluetoothSettings: () -> Unit
) {
    val palette = LocalGaragePalette.current
    val isObdConnected = state.obd.connectionState == ObdConnectionState.CONNECTED

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Brush.verticalGradient(listOf(palette.canvasTop, palette.canvasBottom)))
    ) {
        Image(
            painter = painterResource(id = R.drawable.meu_carro),
            contentDescription = state.carName,
            contentScale = ContentScale.Crop,
            modifier = Modifier.fillMaxSize()
        )

        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    Brush.verticalGradient(
                        0.0f to Color(0xCC060910),
                        0.32f to Color(0x33060910),
                        0.72f to Color(0x55060910),
                        1.0f to Color(0xF005080F)
                    )
                )
        )

        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 18.dp, vertical = 12.dp),
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            // TOPO
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Top
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(10.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        IconButton(onClick = onOpenWifiSettings, modifier = Modifier.size(44.dp)) {
                            Icon(Icons.Rounded.Wifi, contentDescription = "Wi-Fi", tint = palette.textPrimary)
                        }
                        IconButton(onClick = onOpenBluetoothSettings, modifier = Modifier.size(44.dp)) {
                            Icon(Icons.Rounded.Bluetooth, contentDescription = "Bluetooth", tint = palette.textPrimary)
                        }

                        // Botão discreto de status OBD2 no topo
                        val obdBadgeColor = when (state.obd.connectionState) {
                            ObdConnectionState.CONNECTED -> palette.okGreen
                            ObdConnectionState.CONNECTING, ObdConnectionState.RECONNECTING -> palette.warningAmber
                            ObdConnectionState.DISCONNECTED -> palette.textSecondary
                        }
                        Row(
                            modifier = Modifier
                                .clip(RoundedCornerShape(10.dp))
                                .background(palette.panelSurface)
                                .border(1.dp, obdBadgeColor.copy(alpha = 0.55f), RoundedCornerShape(10.dp))
                                .clickable(onClick = onOpenObdDialog)
                                .padding(horizontal = 10.dp, vertical = 6.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            Icon(Icons.Rounded.Build, contentDescription = "Status OBD2", tint = obdBadgeColor, modifier = Modifier.size(16.dp))
                            Text(
                                text = "OBD2: \${state.obd.connectionState.label}",
                                fontSize = 12.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = palette.textPrimary
                            )
                            if (state.obd.dtcCodes.isNotEmpty()) {
                                Text(
                                    text = "(\${state.obd.dtcCodes.size})",
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = palette.alertRed
                                )
                            }
                        }
                    }

                    Row(
                        horizontalArrangement = Arrangement.spacedBy(12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        CircularTelemetryGauge(
                            title = "MOTOR",
                            value = state.obd.coolantTempC.toString(),
                            unit = "°C",
                            fraction = (state.obd.coolantTempC / 120f).coerceIn(0f, 1f),
                            accentColor = if (state.obd.coolantTempC >= 104) palette.alertRed else palette.neonSecondary,
                            onClick = onOpenObdDialog
                        )
                        CircularTelemetryGauge(
                            title = "BATERIA",
                            value = String.format(Locale.US, "%.1f", state.obd.batteryVoltage).replace('.', ','),
                            unit = "V",
                            fraction = ((state.obd.batteryVoltage - 10f) / 5f).coerceIn(0f, 1f),
                            accentColor = if (state.obd.batteryVoltage <= 11.8f) palette.warningAmber else palette.neonSecondary,
                            onClick = onOpenObdDialog
                        )
                        // Card compacto do Computador de Bordo (km/l atual, distância, R$ gasto)
                        CompactTripCard(
                            kmPerLiter = state.trip.instantKmPerLiter,
                            distanceKm = state.trip.distanceKm,
                            costBrl = state.trip.estimatedCostBrl,
                            onClick = onOpenTripDialog
                        )
                    }
                }

                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(text = state.clockText, style = MaterialTheme.typography.displayMedium, color = palette.textPrimary)
                    Text(text = state.dateText, style = MaterialTheme.typography.bodyMedium, color = palette.textSecondary)
                }

                Column(horizontalAlignment = Alignment.End, verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Row(
                        modifier = Modifier
                            .clip(RoundedCornerShape(12.dp))
                            .clickable(onClick = onRefreshWeather)
                            .padding(horizontal = 10.dp, vertical = 6.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Icon(Icons.Rounded.WbSunny, contentDescription = state.weather.conditionLabel, tint = palette.textPrimary, modifier = Modifier.size(26.dp))
                        Text(text = "\${state.weather.temperatureCelsius ?: "--"}°", fontSize = 24.sp, fontWeight = FontWeight.Bold, color = palette.textPrimary)
                    }

                    Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        CircularTelemetryGauge(
                            title = "ADMISSÃO",
                            value = state.obd.intakeTempC.toString(),
                            unit = "°C",
                            fraction = (state.obd.intakeTempC / 70f).coerceIn(0f, 1f),
                            accentColor = palette.neonSecondary,
                            onClick = onOpenObdDialog
                        )
                        CircularTelemetryGauge(
                            title = "CARGA",
                            value = state.obd.engineLoadPercent.toString(),
                            unit = "%",
                            fraction = (state.obd.engineLoadPercent / 100f).coerceIn(0f, 1f),
                            accentColor = palette.neonSecondary,
                            onClick = onOpenObdDialog
                        )
                    }
                }
            }

            // MEIO: Velocímetro Unificado (KM/H + Arco RPM + Shift-Light) | Centro Carro | Waze GPS
            Row(
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                SpeedometerWingCard(
                    speedKmh = state.activeSpeedKmh,
                    rpm = state.obd.rpm,
                    coolantTempC = state.obd.coolantTempC,
                    batteryVoltage = state.obd.batteryVoltage,
                    speedLimitKmh = state.speedLimitKmh,
                    isOverLimit = state.isOverSpeedLimit,
                    sourceLabel = if (isObdConnected) "OBD2" else "GPS",
                    accentColor = palette.neonPrimary,
                    onClickSpeed = onOpenSettings,
                    onClickObd = onOpenObdDialog
                )

                Spacer(Modifier.weight(1f))

                WazeGpsWingCard(
                    speedKmh = state.activeSpeedKmh,
                    onOpenWaze = { onLaunchApp("com.waze") }
                )
            }

            // ATALHOS EM PARALELOGRAMO
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(64.dp),
                horizontalArrangement = Arrangement.spacedBy(10.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                state.shortcuts.forEach { shortcut ->
                    SkewedShortcutButton(
                        shortcut = shortcut,
                        onClick = { onShortcutClick(shortcut.slotIndex, shortcut) },
                        onLongClick = { onStartReplaceShortcut(shortcut.slotIndex) },
                        modifier = Modifier.weight(1f).fillMaxHeight()
                    )
                }

                Button(
                    onClick = onOpenDrawer,
                    modifier = Modifier.width(104.dp).fillMaxHeight(),
                    shape = ParallelogramShape,
                    colors = ButtonDefaults.buttonColors(containerColor = palette.tileSelected, contentColor = Color.White),
                    contentPadding = PaddingValues(0.dp)
                ) {
                    Icon(Icons.Rounded.Apps, contentDescription = "Todos os Apps", modifier = Modifier.size(28.dp))
                }
            }

            // BARRA INFERIOR
            Row(
                modifier = Modifier.fillMaxWidth().height(66.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    IconButton(onClick = onVoiceCommand, modifier = Modifier.size(64.dp)) {
                        Icon(Icons.Rounded.Mic, contentDescription = "Voz", tint = palette.textPrimary)
                    }
                    IconButton(onClick = onVolumeDown, modifier = Modifier.size(64.dp)) {
                        Icon(Icons.Rounded.VolumeDown, contentDescription = "Volume -", tint = palette.textPrimary)
                    }
                    IconButton(onClick = onMediaPrevious, modifier = Modifier.size(64.dp)) {
                        Icon(Icons.Rounded.SkipPrevious, contentDescription = "Anterior", tint = palette.textSecondary)
                    }
                }

                Column(
                    modifier = Modifier
                        .weight(1f)
                        .clip(RoundedCornerShape(12.dp))
                        .clickable(onClick = onGrantMediaPermission)
                        .padding(horizontal = 16.dp, vertical = 6.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(text = state.media.title, style = MaterialTheme.typography.titleMedium, color = palette.textPrimary, maxLines = 1, overflow = TextOverflow.Ellipsis)
                    Text(text = state.media.subtitle, style = MaterialTheme.typography.bodyMedium, color = palette.textSecondary, maxLines = 1, overflow = TextOverflow.Ellipsis)
                }

                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Button(
                        onClick = onMediaPlayPause,
                        modifier = Modifier.size(64.dp),
                        shape = CircleShape,
                        colors = ButtonDefaults.buttonColors(containerColor = palette.tileSelected.copy(alpha = 0.85f), contentColor = Color.White),
                        contentPadding = PaddingValues(0.dp)
                    ) {
                        Icon(if (state.media.isPlaying) Icons.Rounded.Pause else Icons.Rounded.PlayArrow, contentDescription = "Play/Pause", modifier = Modifier.size(30.dp))
                    }
                    IconButton(onClick = onMediaNext, modifier = Modifier.size(64.dp)) {
                        Icon(Icons.Rounded.SkipNext, contentDescription = "Próxima", tint = palette.textSecondary)
                    }
                    IconButton(onClick = onVolumeUp, modifier = Modifier.size(64.dp)) {
                        Icon(Icons.Rounded.VolumeUp, contentDescription = "Volume +", tint = palette.textPrimary)
                    }
                    IconButton(onClick = onOpenObdDialog, modifier = Modifier.size(64.dp)) {
                        Icon(Icons.Rounded.Speed, contentDescription = "Drive Lab", tint = palette.textPrimary)
                    }
                    IconButton(onClick = onCycleDimmer, modifier = Modifier.size(64.dp)) {
                        Icon(Icons.Rounded.WbSunny, contentDescription = "Brilho", tint = palette.textPrimary)
                    }
                    IconButton(onClick = onOpenSettings, modifier = Modifier.size(64.dp)) {
                        Icon(Icons.Rounded.Tune, contentDescription = "Ajustes", tint = palette.textPrimary)
                    }
                }
            }
        }

        // MODAIS E GAVETAS
        if (state.isAppDrawerOpen) {
            AppDrawerDialog(
                apps = state.installedApps,
                replacingSlotIndex = state.replacingSlotIndex,
                onDismiss = onCloseDrawer,
                onAppSelected = { app ->
                    val slot = state.replacingSlotIndex
                    if (slot != null) onAssignShortcut(slot, app)
                    else {
                        onCloseDrawer()
                        onLaunchApp(app.packageName)
                    }
                }
            )
        }

        if (state.isObdDialogOpen) {
            DriveLabHealthDialog(
                state = state,
                onRefreshDevices = onRefreshPairedDevices,
                onConnectDevice = onConnectObdDevice,
                onDisconnect = onDisconnectObd,
                onReadDtc = onReadDtcCodes,
                onClearDtc = onClearDtcCodes,
                onDismiss = onCloseObdDialog
            )
        }

        if (state.isTripDialogOpen) {
            TripSummaryDialog(
                state = state,
                onResetTrip = onResetTrip,
                onDismiss = onCloseTripDialog
            )
        }

        if (state.isSettingsOpen) {
            CockpitSettingsDialog(
                state = state,
                onReplaySplash = onReplaySplash,
                onDismiss = onCloseSettings,
                onSave = onUpdateFullConfig
            )
        }

        // SPLASH INTRO OVERLAY (sobrepõe a tela por 2,5s enquanto GPS/OBD/mídia carregam em segundo plano)
        if (state.showSplashIntro) {
            SplashIntroOverlay(
                carName = state.carName,
                onFinished = onSkipSplash
            )
        }
    }
}

@Composable
private fun CompactTripCard(
    kmPerLiter: Float,
    distanceKm: Float,
    costBrl: Float,
    onClick: () -> Unit
) {
    val palette = LocalGaragePalette.current
    Column(
        modifier = Modifier
            .premiumGlassCard(glowColor = Color(0xFF34D399), cornerRadius = 14.dp)
            .clickable(onClick = onClick)
            .padding(horizontal = 14.dp, vertical = 8.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text("VIAGEM", fontSize = 10.sp, fontWeight = FontWeight.SemiBold, color = Color(0xFF34D399))
        Text(
            text = String.format(Locale.US, "%.1f km/l", kmPerLiter).replace('.', ','),
            fontSize = 15.sp,
            fontWeight = FontWeight.Bold,
            color = palette.textPrimary
        )
        Text(
            text = String.format(Locale.US, "%.1f km · R$ %.2f", distanceKm, costBrl).replace('.', ','),
            fontSize = 10.sp,
            color = palette.neonSecondary
        )
    }
}

@Composable
private fun CircularTelemetryGauge(
    title: String,
    value: String,
    unit: String,
    fraction: Float,
    accentColor: Color,
    onClick: () -> Unit
) {
    val palette = LocalGaragePalette.current
    val gradientStart = when (title) {
        "MOTOR" -> Color(0xFF38BDF8)
        "BATERIA" -> Color(0xFF10B981)
        "ADMISSÃO" -> Color(0xFF22D3EE)
        else -> Color(0xFF818CF8)
    }
    val gradientEnd = when (title) {
        "MOTOR" -> if (fraction >= 0.85f) palette.alertRed else Color(0xFFF59E0B)
        "BATERIA" -> Color(0xFF34D399)
        "ADMISSÃO" -> Color(0xFF38BDF8)
        else -> Color(0xFFF472B6)
    }
    Column(
        modifier = Modifier
            .clip(RoundedCornerShape(14.dp))
            .clickable(onClick = onClick)
            .padding(4.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Box(modifier = Modifier.size(66.dp), contentAlignment = Alignment.Center) {
            Canvas(modifier = Modifier.fillMaxSize()) {
                val stroke = 5.5.dp.toPx()
                val inset = stroke / 2f
                val arcSize = Size(size.width - stroke, size.height - stroke)
                drawArc(
                    color = Color(0xFF1D2942),
                    startAngle = 135f,
                    sweepAngle = 270f,
                    useCenter = false,
                    topLeft = Offset(inset, inset),
                    size = arcSize,
                    style = Stroke(width = stroke, cap = StrokeCap.Round)
                )
                drawArc(
                    brush = Brush.linearGradient(listOf(gradientStart, gradientEnd)),
                    startAngle = 135f,
                    sweepAngle = 270f * fraction,
                    useCenter = false,
                    topLeft = Offset(inset, inset),
                    size = arcSize,
                    style = Stroke(width = stroke, cap = StrokeCap.Round)
                )
            }
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text(text = value, fontSize = 15.sp, fontWeight = FontWeight.Bold, color = palette.textPrimary)
                Text(text = unit, fontSize = 10.sp, color = gradientEnd)
            }
        }
        Spacer(Modifier.height(2.dp))
        Text(text = title, fontSize = 10.sp, fontWeight = FontWeight.SemiBold, color = palette.textSecondary)
    }
}

@Composable
private fun SpeedometerWingCard(
    speedKmh: Int,
    rpm: Int,
    coolantTempC: Int,
    batteryVoltage: Float,
    speedLimitKmh: Int,
    isOverLimit: Boolean,
    sourceLabel: String,
    accentColor: Color,
    onClickSpeed: () -> Unit,
    onClickObd: () -> Unit
) {
    val palette = LocalGaragePalette.current
    val highlight = if (isOverLimit) palette.alertRed else accentColor
    val activeSegments = ((rpm / 7000f) * 16).toInt().coerceIn(0, 16)
    val rpmFraction = (rpm / 7000f).coerceIn(0f, 1f)
    val arcBrush = Brush.sweepGradient(
        0.0f to Color(0xFF38BDF8),
        0.45f to Color(0xFF10B981),
        0.72f to Color(0xFFF59E0B),
        0.92f to Color(0xFFFF2E4C),
        1.0f to Color(0xFF38BDF8)
    )

    Column(
        modifier = Modifier
            .width(260.dp)
            .premiumMetallicCard(glowColor = highlight, cornerRadius = 16.dp, glowAlpha = 0.78f)
            .clickable(onClick = onClickSpeed)
            .padding(14.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Text("VELOCIDADE", fontSize = 11.sp, fontWeight = FontWeight.SemiBold, color = palette.textSecondary)
            Text(sourceLabel, fontSize = 10.sp, fontWeight = FontWeight.Bold, color = highlight)
        }
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(verticalAlignment = Alignment.Bottom, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                Text(text = speedKmh.toString(), style = MaterialTheme.typography.displayLarge, color = if (isOverLimit) palette.alertRed else palette.textPrimary)
                Text(text = "KM/H", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = highlight, modifier = Modifier.padding(bottom = 12.dp))
            }

            Box(
                modifier = Modifier
                    .size(74.dp)
                    .clip(CircleShape)
                    .clickable(onClick = onClickObd),
                contentAlignment = Alignment.Center
            ) {
                Canvas(modifier = Modifier.fillMaxSize()) {
                    val stroke = 6.dp.toPx()
                    val inset = stroke / 2f
                    val arcSize = Size(size.width - stroke, size.height - stroke)
                    drawArc(
                        color = Color(0xFF1D2942),
                        startAngle = 135f,
                        sweepAngle = 270f,
                        useCenter = false,
                        topLeft = Offset(inset, inset),
                        size = arcSize,
                        style = Stroke(width = stroke, cap = StrokeCap.Round)
                    )
                    drawArc(
                        brush = arcBrush,
                        startAngle = 135f,
                        sweepAngle = 270f * rpmFraction,
                        useCenter = false,
                        topLeft = Offset(inset, inset),
                        size = arcSize,
                        style = Stroke(width = stroke, cap = StrokeCap.Round)
                    )
                }
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(text = rpm.toString(), fontSize = 14.sp, fontWeight = FontWeight.Black, color = palette.textPrimary)
                    Text(text = "RPM", fontSize = 8.sp, color = if (rpm >= 5800) palette.alertRed else palette.neonSecondary)
                }
            }
        }
        Row(horizontalArrangement = Arrangement.spacedBy(3.dp)) {
            repeat(16) { index ->
                val segColor = when {
                    index >= activeSegments -> Color(0xFF1F2B44)
                    index >= 13 -> Color(0xFFFF2E4C)
                    index >= 10 -> Color(0xFFF59E0B)
                    index >= 6 -> Color(0xFF10B981)
                    else -> Color(0xFF38BDF8)
                }
                Box(modifier = Modifier.weight(1f).height(9.dp).background(segColor, RoundedCornerShape(2.dp)))
            }
        }
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Text(
                text = String.format(Locale.US, "%d°C · %.1fV", coolantTempC, batteryVoltage),
                fontSize = 11.sp,
                color = palette.neonSecondary
            )
            Text(text = "Lim. $speedLimitKmh km/h", fontSize = 11.sp, color = palette.textSecondary)
        }
    }
}

@Composable
private fun WazeGpsWingCard(
    speedKmh: Int,
    onOpenWaze: () -> Unit
) {
    val palette = LocalGaragePalette.current
    val wazeCyan = Color(0xFF38BDF8)

    Column(
        modifier = Modifier
            .width(236.dp)
            .premiumMetallicCard(glowColor = wazeCyan, cornerRadius = 16.dp, glowAlpha = 0.72f)
            .clickable(onClick = onOpenWaze)
            .padding(12.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
            Text("WAZE GPS", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = wazeCyan)
            Text(
                text = if (speedKmh > 0) "ROTA ATIVA" else "PRONTO",
                fontSize = 10.sp,
                fontWeight = FontWeight.Bold,
                color = Color(0xFF34D399)
            )
        }

        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(78.dp)
                .clip(RoundedCornerShape(12.dp))
                .background(Color(0xFF060C18))
                .border(1.dp, wazeCyan.copy(alpha = 0.25f), RoundedCornerShape(12.dp))
        ) {
            Canvas(modifier = Modifier.fillMaxSize()) {
                val roadColor = Color(0xFF172542)
                drawLine(roadColor, Offset(0f, size.height * 0.25f), Offset(size.width, size.height * 0.25f), strokeWidth = 4f)
                drawLine(roadColor, Offset(0f, size.height * 0.60f), Offset(size.width, size.height * 0.60f), strokeWidth = 4f)
                drawLine(roadColor, Offset(size.width * 0.22f, 0f), Offset(size.width * 0.22f, size.height), strokeWidth = 4f)
                drawLine(roadColor, Offset(size.width * 0.74f, 0f), Offset(size.width * 0.74f, size.height), strokeWidth = 4f)

                val routePath = Path().apply {
                    moveTo(size.width * 0.22f, size.height * 0.94f)
                    lineTo(size.width * 0.22f, size.height * 0.45f)
                    lineTo(size.width * 0.74f, size.height * 0.45f)
                    lineTo(size.width * 0.74f, size.height * 0.14f)
                }
                drawPath(
                    path = routePath,
                    color = wazeCyan.copy(alpha = 0.28f),
                    style = Stroke(width = 14f, cap = StrokeCap.Round, join = StrokeJoin.Round)
                )
                drawPath(
                    path = routePath,
                    brush = Brush.linearGradient(listOf(Color(0xFF2563EB), Color(0xFF38BDF8), Color(0xFF22D3EE))),
                    style = Stroke(width = 5f, cap = StrokeCap.Round, join = StrokeJoin.Round)
                )
                drawCircle(color = Color(0xFF22D3EE), radius = 7f, center = Offset(size.width * 0.74f, size.height * 0.14f))
                drawCircle(color = Color.White, radius = 6f, center = Offset(size.width * 0.22f, size.height * 0.78f))
            }

            Row(
                modifier = Modifier
                    .align(Alignment.TopStart)
                    .padding(6.dp)
                    .clip(RoundedCornerShape(8.dp))
                    .background(Color(0xE6091224))
                    .padding(horizontal = 8.dp, vertical = 4.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                Icon(Icons.Rounded.Navigation, contentDescription = "Rota Waze", tint = wazeCyan, modifier = Modifier.size(14.dp))
                Column {
                    Text("350 m", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = palette.textPrimary)
                    Text("Av. Paulista", fontSize = 9.sp, color = palette.textSecondary)
                }
            }
        }

        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Text("Casa · 14 min", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = palette.textPrimary)
            Text("6,4 km", fontSize = 11.sp, fontWeight = FontWeight.SemiBold, color = wazeCyan)
        }
    }
}

@OptIn(ExperimentalFoundationApi::class)
@Composable
private fun SkewedShortcutButton(
    shortcut: QuickShortcut,
    onClick: () -> Unit,
    onLongClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val palette = LocalGaragePalette.current
    val (icon, brandColor) = when {
        shortcut.packageName.contains("waze") -> Icons.Rounded.Place to Color(0xFF38BDF8)
        shortcut.packageName.contains("maps") -> Icons.Rounded.Place to Color(0xFF34D399)
        shortcut.packageName.contains("spotify") -> Icons.Rounded.MusicNote to Color(0xFF1DB954)
        shortcut.packageName.contains("music") || shortcut.packageName.contains("youtube") -> Icons.Rounded.MusicNote to Color(0xFFFF3B5C)
        shortcut.packageName.contains("projection") -> Icons.Rounded.DirectionsCar to Color(0xFF60A5FA)
        else -> Icons.Rounded.Apps to palette.neonSecondary
    }

    Surface(
        modifier = modifier.combinedClickable(onClick = onClick, onLongClick = onLongClick),
        shape = ParallelogramShape,
        color = Color(0xD80E182D),
        border = BorderStroke(1.dp, brandColor.copy(alpha = 0.55f))
    ) {
        Box(modifier = Modifier.fillMaxSize()) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(3.dp)
                    .align(Alignment.BottomCenter)
                    .background(Brush.horizontalGradient(listOf(Color.Transparent, brandColor, Color.Transparent)))
            )
            Row(
                modifier = Modifier.fillMaxSize().padding(horizontal = 16.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.Center
            ) {
                Icon(icon, contentDescription = shortcut.label, tint = brandColor, modifier = Modifier.size(18.dp))
                Spacer(Modifier.width(8.dp))
                Text(text = shortcut.label, fontSize = 12.sp, fontWeight = FontWeight.Bold, color = palette.textPrimary, maxLines = 1, overflow = TextOverflow.Ellipsis)
            }
        }
    }
}

@Composable
private fun DriveLabHealthDialog(
    state: LauncherUiState,
    onRefreshDevices: () -> Unit,
    onConnectDevice: (String) -> Unit,
    onDisconnect: () -> Unit,
    onReadDtc: () -> Unit,
    onClearDtc: () -> Unit,
    onDismiss: () -> Unit
) {
    val palette = LocalGaragePalette.current
    Dialog(onDismissRequest = onDismiss, properties = DialogProperties(usePlatformDefaultWidth = false)) {
        Surface(
            modifier = Modifier.fillMaxSize().padding(28.dp),
            shape = RoundedCornerShape(22.dp),
            color = palette.canvasBottom,
            border = BorderStroke(1.dp, palette.borderGlow)
        ) {
            Column(
                modifier = Modifier.fillMaxSize().padding(20.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                    Column {
                        Text("Drive Lab / Saúde do Veículo", style = MaterialTheme.typography.titleLarge, color = palette.textPrimary)
                        Text("OBD2: \${state.obd.connectionState.label} \${state.obd.connectedDeviceName}", color = palette.textSecondary)
                    }
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        OutlinedButton(onClick = onRefreshDevices, modifier = Modifier.height(52.dp)) { Text("Atualizar BT") }
                        if (state.obd.connectionState != ObdConnectionState.DISCONNECTED) {
                            OutlinedButton(onClick = onDisconnect, modifier = Modifier.height(52.dp)) { Text("Desconectar") }
                        }
                        Button(onClick = onDismiss, modifier = Modifier.height(52.dp)) { Text("Fechar") }
                    }
                }

                Row(modifier = Modifier.weight(1f).fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                    // Coluna Esquerda: Dispositivos Pareados + Sensores
                    Column(modifier = Modifier.weight(1f).fillMaxHeight(), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        Text("Sensores ao Vivo", style = MaterialTheme.typography.titleMedium, color = palette.neonSecondary)
                        Text(
                            text = "RPM: \${state.obd.rpm} · Vel: \${state.obd.vehicleSpeedKmh} km/h · Motor: \${state.obd.coolantTempC}°C · Bat: \${state.obd.batteryVoltage}V · Carga: \${state.obd.engineLoadPercent}%",
                            color = palette.textPrimary
                        )
                        Text("Pareados (Toque para conectar ELM327)", style = MaterialTheme.typography.titleMedium, color = palette.neonSecondary)
                        LazyColumn(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            items(state.pairedDevices) { device ->
                                Button(
                                    onClick = { onConnectDevice(device.address) },
                                    modifier = Modifier.fillMaxWidth().height(56.dp),
                                    colors = ButtonDefaults.buttonColors(containerColor = palette.tileSurface)
                                ) {
                                    Text("\${device.name} (\${device.address})", maxLines = 1, overflow = TextOverflow.Ellipsis)
                                }
                            }
                        }
                    }

                    // Coluna Direita: Códigos de Falha (Mode 03 / Mode 04)
                    Column(modifier = Modifier.weight(1f).fillMaxHeight(), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            Button(onClick = onReadDtc, modifier = Modifier.weight(1f).height(56.dp)) { Text("Ler Falhas (Modo 03)") }
                            OutlinedButton(onClick = onClearDtc, modifier = Modifier.weight(1f).height(56.dp)) { Text("Limpar (Modo 04)") }
                        }
                        if (state.obd.dtcCodes.isEmpty()) {
                            Box(modifier = Modifier.weight(1f).fillMaxWidth().background(palette.tileSurface, RoundedCornerShape(14.dp)), contentAlignment = Alignment.Center) {
                                Text("Nenhum código de falha DTC ativo.", color = palette.okGreen)
                            }
                        } else {
                            LazyColumn(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                items(state.obd.dtcCodes) { dtc ->
                                    Column(modifier = Modifier.fillMaxWidth().background(palette.alertRed.copy(alpha = 0.16f), RoundedCornerShape(12.dp)).padding(12.dp)) {
                                        Text(dtc.code, fontWeight = FontWeight.Bold, color = palette.alertRed)
                                        Text(dtc.descriptionPtBr, color = palette.textPrimary)
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun TripSummaryDialog(
    state: LauncherUiState,
    onResetTrip: () -> Unit,
    onDismiss: () -> Unit
) {
    val palette = LocalGaragePalette.current
    val h = state.trip.activeDrivingSeconds / 3600
    val m = (state.trip.activeDrivingSeconds % 3600) / 60
    val s = state.trip.activeDrivingSeconds % 60
    val timeFormatted = String.format(Locale.US, "%02d:%02d:%02d", h, m, s)

    AlertDialog(
        onDismissRequest = onDismiss,
        containerColor = palette.tileSurface,
        title = { Text("Resumo da Viagem (\${state.fuelType.label})", color = palette.textPrimary) },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("Fonte: \${if (state.trip.usingObdSource) "OBD2 (MAF/MAP + RPM)" else "GPS + Cilindrada \${state.engineDisplacementLiters}L"}", color = palette.neonSecondary)
                Text(String.format(Locale.US, "Distância: %.2f km", state.trip.distanceKm), color = palette.textPrimary)
                Text("Tempo ativo: \$timeFormatted", color = palette.textPrimary)
                Text(String.format(Locale.US, "Velocidade média: %.1f km/h", state.trip.averageSpeedKmh), color = palette.textPrimary)
                Text(String.format(Locale.US, "Consumo médio: %.1f km/l (%.2f L gastos)", state.trip.averageKmPerLiter, state.trip.fuelConsumedLiters), color = palette.textPrimary)
                Text(String.format(Locale.US, "Custo estimado: R$ %.2f", state.trip.estimatedCostBrl), fontWeight = FontWeight.Bold, color = palette.okGreen)
            }
        },
        confirmButton = {
            Button(onClick = onDismiss, modifier = Modifier.height(52.dp)) { Text("Fechar") }
        },
        dismissButton = {
            OutlinedButton(onClick = onResetTrip, modifier = Modifier.height(52.dp)) { Text("Zerar Viagem") }
        }
    )
}

@Composable
private fun CockpitSettingsDialog(
    state: LauncherUiState,
    onReplaySplash: () -> Unit,
    onDismiss: () -> Unit,
    onSave: (String, Int, NeonAccentPreset, Float, FuelType, Float, Boolean) -> Unit
) {
    val palette = LocalGaragePalette.current
    var carName by remember(state.carName) { mutableStateOf(state.carName) }
    var limit by remember(state.speedLimitKmh) { mutableFloatStateOf(state.speedLimitKmh.toFloat()) }
    var preset by remember(state.accentPreset) { mutableStateOf(state.accentPreset) }
    var displacement by remember(state.engineDisplacementLiters) { mutableFloatStateOf(state.engineDisplacementLiters) }
    var fuelType by remember(state.fuelType) { mutableStateOf(state.fuelType) }
    var fuelPrice by remember(state.fuelPriceBrl) { mutableStateOf(state.fuelPriceBrl.toString()) }
    var splashEnabled by remember(state.splashAnimationEnabled) { mutableStateOf(state.splashAnimationEnabled) }

    AlertDialog(
        onDismissRequest = onDismiss,
        containerColor = palette.tileSurface,
        title = { Text("Ajustes do Cockpit e Veículo", color = palette.textPrimary) },
        text = {
            Column(modifier = Modifier.verticalScroll(rememberScrollState()), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                OutlinedTextField(value = carName, onValueChange = { carName = it }, label = { Text("Nome do Carro") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                Text("Limite de Alerta: \${limit.toInt()} km/h", color = palette.textPrimary)
                Slider(value = limit, onValueChange = { limit = it }, valueRange = 40f..180f)

                Text(String.format(Locale.US, "Cilindrada do Motor: %.1f L", displacement), color = palette.textPrimary)
                Slider(value = displacement, onValueChange = { displacement = it }, valueRange = 1.0f..4.0f)

                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    FuelType.entries.forEach { fuel ->
                        Button(
                            onClick = { fuelType = fuel },
                            modifier = Modifier.weight(1f).height(48.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = if (fuelType == fuel) palette.tileSelected else palette.panelSurface)
                        ) { Text(fuel.label) }
                    }
                }

                OutlinedTextField(value = fuelPrice, onValueChange = { fuelPrice = it }, label = { Text("Preço do Litro (R$)") }, singleLine = true, modifier = Modifier.fillMaxWidth())

                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    NeonAccentPreset.entries.forEach { item ->
                        Button(
                            onClick = { preset = item },
                            modifier = Modifier.weight(1f).height(48.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = if (preset == item) palette.tileSelected else palette.panelSurface)
                        ) { Text(item.label, maxLines = 1) }
                    }
                }

                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                    Text("Animação ao ligar", color = palette.textPrimary)
                    Switch(checked = splashEnabled, onCheckedChange = { splashEnabled = it })
                }

                OutlinedButton(onClick = onReplaySplash, modifier = Modifier.fillMaxWidth().height(48.dp)) {
                    Text("Testar Animação de Entrada")
                }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    val parsedPrice = fuelPrice.replace(',', '.').toFloatOrNull() ?: state.fuelPriceBrl
                    onSave(carName, limit.toInt(), preset, displacement, fuelType, parsedPrice, splashEnabled)
                },
                modifier = Modifier.height(52.dp)
            ) { Text("Salvar") }
        },
        dismissButton = {
            OutlinedButton(onClick = onDismiss, modifier = Modifier.height(52.dp)) { Text("Cancelar") }
        }
    )
}`
    },
    {
      id: 'app-drawer-dialog',
      name: 'AppDrawerDialog.kt',
      path: 'app/src/main/java/com/garagem/launcher/ui/AppDrawerDialog.kt',
      category: 'Compose UI',
      language: 'kotlin',
      summary: 'Gaveta de aplicativos em grade com PackageManager, busca, abertura em 1 toque e troca dos 5 atalhos.',
      code: `package com.garagem.launcher.ui

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Apps
import androidx.compose.material.icons.rounded.Close
import androidx.compose.material.icons.rounded.Search
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.garagem.launcher.model.InstalledAppInfo
import com.garagem.launcher.ui.theme.LocalGaragePalette

@Composable
fun AppDrawerDialog(
    apps: List<InstalledAppInfo>,
    replacingSlotIndex: Int?,
    onDismiss: () -> Unit,
    onAppSelected: (InstalledAppInfo) -> Unit
) {
    val palette = LocalGaragePalette.current
    var searchQuery by remember { mutableStateOf("") }

    val filteredApps = remember(apps, searchQuery) {
        if (searchQuery.isBlank()) apps
        else {
            val q = searchQuery.trim().lowercase()
            apps.filter { it.label.lowercase().contains(q) || it.packageName.lowercase().contains(q) }
        }
    }

    Dialog(onDismissRequest = onDismiss, properties = DialogProperties(usePlatformDefaultWidth = false)) {
        Surface(
            modifier = Modifier.fillMaxSize().padding(20.dp),
            shape = RoundedCornerShape(22.dp),
            color = palette.canvasBottom,
            border = BorderStroke(1.dp, palette.borderGlow)
        ) {
            Column(modifier = Modifier.fillMaxSize().padding(18.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
                Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(14.dp)) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = if (replacingSlotIndex != null) "Trocar Atalho #\${replacingSlotIndex + 1}" else "Aplicativos da Central (\${filteredApps.size})",
                            style = MaterialTheme.typography.titleLarge,
                            color = palette.textPrimary
                        )
                        Text(
                            text = if (replacingSlotIndex != null) "Toque em qualquer aplicativo para fixar" else "Toque para abrir o aplicativo",
                            style = MaterialTheme.typography.bodyMedium,
                            color = palette.textSecondary
                        )
                    }

                    OutlinedTextField(
                        value = searchQuery,
                        onValueChange = { searchQuery = it },
                        placeholder = { Text("Buscar app...") },
                        leadingIcon = { Icon(Icons.Rounded.Search, contentDescription = null) },
                        singleLine = true,
                        modifier = Modifier.width(260.dp)
                    )

                    OutlinedButton(
                        onClick = onDismiss,
                        modifier = Modifier.height(64.dp),
                        shape = RoundedCornerShape(14.dp),
                        border = BorderStroke(1.dp, palette.borderGlow)
                    ) {
                        Icon(Icons.Rounded.Close, contentDescription = "Fechar", tint = palette.textPrimary)
                        Spacer(Modifier.width(6.dp))
                        Text("Fechar", color = palette.textPrimary)
                    }
                }

                LazyVerticalGrid(
                    columns = GridCells.Adaptive(minSize = 148.dp),
                    modifier = Modifier.weight(1f).fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(filteredApps, key = { it.packageName }) { app ->
                        Button(
                            onClick = { onAppSelected(app) },
                            modifier = Modifier.fillMaxWidth().height(104.dp),
                            shape = RoundedCornerShape(16.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = palette.tileSurface, contentColor = palette.textPrimary),
                            border = BorderStroke(1.dp, palette.borderGlow),
                            contentPadding = PaddingValues(10.dp)
                        ) {
                            Column(modifier = Modifier.fillMaxSize(), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center) {
                                if (app.icon != null) {
                                    Image(bitmap = app.icon, contentDescription = app.label, modifier = Modifier.size(42.dp))
                                } else {
                                    Box(modifier = Modifier.size(42.dp).background(palette.panelSurface, RoundedCornerShape(10.dp)), contentAlignment = Alignment.Center) {
                                        Icon(Icons.Rounded.Apps, contentDescription = null, tint = palette.neonSecondary)
                                    }
                                }
                                Spacer(Modifier.height(8.dp))
                                Text(text = app.label, style = MaterialTheme.typography.bodyMedium, color = palette.textPrimary, textAlign = TextAlign.Center, maxLines = 1, overflow = TextOverflow.Ellipsis)
                            }
                        }
                    }
                }
            }
        }
    }
}`
    }
  ];
}
