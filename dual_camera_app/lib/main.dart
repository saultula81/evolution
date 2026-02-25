import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:permission_handler/permission_handler.dart';

void main() {
  runApp(const DualCameraApp());
}

class DualCameraApp extends StatelessWidget {
  const DualCameraApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Dual Camera TCL 509',
      theme: ThemeData(
        brightness: Brightness.dark,
        primaryColor: const Color(0xFF6200EE),
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF6200EE),
          brightness: Brightness.dark,
        ),
        useMaterial3: true,
      ),
      home: const CameraSupportScreen(),
    );
  }
}

class CameraSupportScreen extends StatefulWidget {
  const CameraSupportScreen({super.key});

  @override
  State<CameraSupportScreen> createState() => _CameraSupportScreenState();
}

class _CameraSupportScreenState extends State<CameraSupportScreen> {
  static const platform = MethodChannel('com.antigravity.dualcamera/camera');
  String _supportStatus = 'Verificando hardware...';
  bool _isSupported = false;
  bool _isLoading = true;
  int? _frontTextureId;
  int? _backTextureId;
  bool _isStreaming = false;

  @override
  void initState() {
    super.initState();
    _checkSupport();
    _requestPermissions();
  }

  Future<void> _requestPermissions() async {
    await [
      Permission.camera,
      Permission.microphone,
    ].request();
  }

  Future<void> _checkSupport() async {
    setState(() => _isLoading = true);
    try {
      final bool result = await platform.invokeMethod('checkConcurrentSupport');
      setState(() {
        _isSupported = result;
        _supportStatus = result 
            ? '¡Tu TCL 509 está listo para Cámara Dual! 🚀' 
            : 'Hardware no compatible con streaming concurrente. ⚠️';
      });
    } on PlatformException catch (e) {
      setState(() => _supportStatus = "Error: ${e.message}");
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _startDualCamera() async {
    try {
      final Map<dynamic, dynamic>? result = await platform.invokeMethod('startDualCamera');
      if (result != null) {
        setState(() {
          _frontTextureId = result['frontTextureId'];
          _backTextureId = result['backTextureId'];
          _isStreaming = true;
        });
      }
    } on PlatformException catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error al iniciar: ${e.message}')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isStreaming) return _buildStreamingUI();

    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Color(0xFF121212), Color(0xFF1E1E1E)],
          ),
        ),
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              _buildHeader(),
              const SizedBox(height: 50),
              if (_isLoading)
                const CircularProgressIndicator()
              else ...[
                _buildStatusCard(),
                const SizedBox(height: 40),
                _buildActionButtons(),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: Colors.blue.withOpacity(0.1),
            border: Border.all(color: Colors.blue.withOpacity(0.5), width: 2),
          ),
          child: const Icon(Icons.camera_rounded, size: 64, color: Colors.blue),
        ),
        const SizedBox(height: 16),
        const Text(
          'Dual Cam TCL',
          style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold, letterSpacing: 1.2),
        ),
      ],
    );
  }

  Widget _buildStatusCard() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 40),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.05),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: _isSupported ? Colors.green.withOpacity(0.3) : Colors.red.withOpacity(0.3)),
      ),
      child: Column(
        children: [
          Icon(
            _isSupported ? Icons.verified_user_rounded : Icons.report_problem_rounded,
            color: _isSupported ? Colors.green : Colors.orange,
            size: 32,
          ),
          const SizedBox(height: 12),
          Text(
            _supportStatus,
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 16, color: Colors.white70),
          ),
        ],
      ),
    );
  }

  Widget _buildActionButtons() {
    return Column(
      children: [
        if (_isSupported)
          ElevatedButton(
            onPressed: _startDualCamera,
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.blue,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 48, vertical: 16),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
              elevation: 8,
            ),
            child: const Text('INICIAR MODO VLOG', style: TextStyle(fontWeight: FontWeight.bold)),
          ),
        const SizedBox(height: 16),
        TextButton(
          onPressed: _checkSupport,
          child: const Text('REINTENTAR VERIFICACIÓN', style: TextStyle(color: Colors.white54)),
        ),
      ],
    );
  }

  Widget _buildStreamingUI() {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          // Background (Rear Camera)
          Positioned.fill(
            child: _backTextureId != null 
                ? Texture(textureId: _backTextureId!) 
                : const Center(child: Text('Cámara Trasera')),
          ),
          
          // PiP (Front Camera)
          Positioned(
            right: 20,
            bottom: 100,
            child: Container(
              width: 120,
              height: 180,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.white, width: 2),
                boxShadow: [BoxShadow(blurRadius: 10, color: Colors.black.withOpacity(0.5))],
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(10),
                child: _frontTextureId != null 
                    ? Texture(textureId: _frontTextureId!) 
                    : Container(color: Colors.grey, child: const Icon(Icons.person)),
              ),
            ),
          ),

          // Controls
          Positioned(
            bottom: 30,
            left: 0,
            right: 0,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                IconButton.filled(
                  onPressed: () => setState(() => _isStreaming = false),
                  icon: const Icon(Icons.close),
                  style: IconButton.styleFrom(backgroundColor: Colors.red),
                ),
                IconButton.filledTonal(
                  onPressed: () {}, // Captura
                  icon: const Icon(Icons.camera, size: 32),
                  padding: const EdgeInsets.all(16),
                ),
                IconButton.filledTonal(
                  onPressed: () {}, // Switch layout
                  icon: const Icon(Icons.layers),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
