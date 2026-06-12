// Simple Stats.js implementation
var Stats = function() {
	var startTime = Date.now(), prevTime = startTime;
	var ms = 0, msMin = Infinity, msMax = 0;
	var fps = 0, fpsMin = Infinity, fpsMax = 0;
	var frames = 0, mode = 0;

	var container = document.createElement('div');
	container.style.cssText = 'position:fixed;top:0;left:0;cursor:pointer;opacity:0.9;z-index:10000;background:#000;color:#0f0;font-family:monospace;font-size:9px;line-height:1.2;padding:8px';

	var fpsDiv = document.createElement('div');
	fpsDiv.style.cssText = 'color:#0f0';
	fpsDiv.textContent = 'FPS: 0';
	container.appendChild(fpsDiv);

	var msDiv = document.createElement('div');
	msDiv.style.cssText = 'color:#0f0';
	msDiv.textContent = 'MS: 0';
	container.appendChild(msDiv);

	this.dom = container;

	this.update = function() {
		startTime = prevTime;
		prevTime = Date.now();

		ms = prevTime - startTime;
		msMin = Math.min(msMin, ms);
		msMax = Math.max(msMax, ms);

		frames++;

		if (prevTime > startTime + 1000) {
			fps = Math.round((frames * 1000) / (prevTime - startTime));
			fpsMin = Math.min(fpsMin, fps);
			fpsMax = Math.max(fpsMax, fps);

			fpsDiv.textContent = 'FPS: ' + fps + ' (' + fpsMin + '-' + fpsMax + ')';
			msDiv.textContent = 'MS: ' + ms + ' (' + msMin + '-' + msMax + ')';

			frames = 0;
		}

		return prevTime;
	};
};

// Simple dat.GUI implementation
var dat = {
	GUI: function(options) {
		var container = document.createElement('div');
		container.style.cssText = 'position:fixed;top:20px;left:20px;background:rgba(0,0,0,0.9);border:1px solid #333;border-radius:4px;padding:10px;font-family:monospace;font-size:12px;color:#fff;z-index:10001';

		var controllers = {};

		this.add = function(obj, prop, options) {
			var value = obj[prop];

			if (Array.isArray(options)) {
				// Dropdown
				var select = document.createElement('select');
				select.style.cssText = 'width:100%;margin:4px 0;padding:4px;background:#222;color:#fff;border:1px solid #555';
				
				options.forEach(function(opt) {
					var optEl = document.createElement('option');
					optEl.value = opt;
					optEl.textContent = opt;
					if (opt === value) optEl.selected = true;
					select.appendChild(optEl);
				});

				select.addEventListener('change', function() {
					obj[prop] = select.value;
					if (this.onFinishChange) this.onFinishChange();
				}.bind(this));

				var label = document.createElement('label');
				label.style.cssText = 'display:block;margin-bottom:8px';
				label.innerHTML = '<span style="color:#2FA1D6">' + prop + ':</span><br>';
				label.appendChild(select);
				container.appendChild(label);
			} else if (typeof options === 'number' || (Array.isArray(options) && options.length === 3)) {
				// Slider
				var min = Array.isArray(options) ? options[0] : options;
				var max = Array.isArray(options) ? options[1] : options * 2;
				var step = Array.isArray(options) ? options[2] : 0.01;

				var slider = document.createElement('input');
				slider.type = 'range';
				slider.min = min;
				slider.max = max;
				slider.step = step;
				slider.value = value;
				slider.style.cssText = 'width:100%;margin:4px 0';

				var valueSpan = document.createElement('span');
				valueSpan.textContent = value.toFixed(2);
				valueSpan.style.cssText = 'color:#2FA1D6;margin-left:8px';

				slider.addEventListener('input', function() {
					obj[prop] = parseFloat(slider.value);
					valueSpan.textContent = obj[prop].toFixed(2);
					if (this.onFinishChange) this.onFinishChange();
				}.bind(this));

				var label = document.createElement('label');
				label.style.cssText = 'display:block;margin-bottom:8px';
				label.innerHTML = '<span style="color:#2FA1D6">' + prop + ':</span><br>';
				label.appendChild(slider);
				label.appendChild(valueSpan);
				container.appendChild(label);
			}

			return this;
		};

		this.domElement = container;

		return this;
	}
};

// Simple OrbitControls implementation
var OrbitControls = function(object, domElement) {
	this.object = object;
	this.domElement = domElement;
	this.autoRotate = false;
	this.autoRotateSpeed = 2;
	this.enablePan = false;

	var mouseDown = false;
	var mouseX = 0;
	var mouseY = 0;

	var self = this;

	this.update = function() {
		if (this.autoRotate) {
			this.object.rotation.y += (this.autoRotateSpeed * Math.PI / 180) / 60;
		}
	};

	this.domElement.addEventListener('mousedown', function() {
		mouseDown = true;
	}, false);

	this.domElement.addEventListener('mouseup', function() {
		mouseDown = false;
	}, false);

	this.domElement.addEventListener('mousemove', function(event) {
		if (mouseDown) {
			var deltaX = event.clientX - mouseX;
			var deltaY = event.clientY - mouseY;
			self.object.rotation.y += deltaX * 0.005;
			self.object.rotation.x += deltaY * 0.005;
		}
		mouseX = event.clientX;
		mouseY = event.clientY;
	}, false);
};

window.onload = function() {
	runSketch();
};

function runSketch() {
	var renderer, scene, camera, clock, stats, controlParameters, uniforms, material, mesh, controls;
	var vertexShaderCode = "", fragmentShaderCode = "";

	loadShaders();

	function loadShaders() {
		Promise.all([
			fetch('shaders/vertex.glsl').then(response => response.text()),
			fetch('shaders/fragment.glsl').then(response => response.text())
		]).then(([vertexShader, fragmentShader]) => {
			vertexShaderCode = vertexShader;
			fragmentShaderCode = fragmentShader;
			init();
			animate();
		}).catch(error => {
			console.error('Error loading shaders:', error);
		});
	}

	function init() {
		// Initialize the WebGL renderer
		renderer = new THREE.WebGLRenderer({
			antialias : true,
			alpha: true
		});
		renderer.setPixelRatio(window.devicePixelRatio);
		renderer.setSize(window.innerWidth, window.innerHeight);
		renderer.setClearColor(new THREE.Color(0, 0, 0), 1);

		var container = document.getElementById("sketch-container");
		container.appendChild(renderer.domElement);

		scene = new THREE.Scene();

		camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 5000);
		camera.position.z = 30;

		controls = new OrbitControls(camera, renderer.domElement);
		controls.enablePan = false;
		controls.autoRotate = true;
		controls.autoRotateSpeed = 2;

		clock = new THREE.Clock(true);

		stats = new Stats();
		document.body.appendChild(stats.dom);

		controlParameters = {
			"Geometry" : "Torus knot",
			"Speed": 1.0,
			"Scale": 1.0
		};

		addControlPanel();

		uniforms = {
			u_time : {
				type : "f",
				value : 0.0
			},
			u_frame : {
				type : "f",
				value : 0.0
			},
			u_resolution : {
				type : "v2",
				value : new THREE.Vector2(window.innerWidth, window.innerHeight)
						.multiplyScalar(window.devicePixelRatio)
			},
			u_mouse : {
				type : "v2",
				value : new THREE.Vector2(0.7 * window.innerWidth, window.innerHeight)
						.multiplyScalar(window.devicePixelRatio)
			}
		};

		material = new THREE.ShaderMaterial({
			uniforms : uniforms,
			vertexShader : vertexShaderCode,
			fragmentShader : fragmentShaderCode,
			side : THREE.DoubleSide,
			transparent : true,
			extensions : {
				derivatives : true
			}
		});

		addMeshToScene();

		window.addEventListener("resize", onWindowResize, false);
		renderer.domElement.addEventListener("mousemove", onMouseMove, false);
		renderer.domElement.addEventListener("touchstart", onTouchMove, false);
		renderer.domElement.addEventListener("touchmove", onTouchMove, false);
	}

	function addControlPanel() {
		var controlPanel = new dat.GUI({
			autoPlace : true
		});

		controlPanel.add(controlParameters, "Geometry", [ "Torus knot", "Sphere", "Icosahedron", "Suzanne" ])
				.onFinishChange = function() { addMeshToScene(); };
		controlPanel.add(controlParameters, "Speed", 0.1, 5.0, 0.1);
		controlPanel.add(controlParameters, "Scale", 0.5, 2.0, 0.1).onFinishChange = function() { addMeshToScene(); };

		document.getElementById("sketch-gui").appendChild(controlPanel.domElement);
	}

	function addMeshToScene() {
		if (mesh) {
			scene.remove(mesh);
		}

		if (controlParameters.Geometry == "Suzanne") {
			var loader = new THREE.BufferGeometryLoader();
			loader.load("objects/suzanne_buffergeometry.json", function(geometry) {
				geometry.scale(10 * controlParameters.Scale, 10 * controlParameters.Scale, 10 * controlParameters.Scale);
				geometry.computeVertexNormals();
				mesh = new THREE.Mesh(geometry, material);
				scene.add(mesh);
			}, undefined, function(error) {
				console.warn('Suzanne geometry not found, using Icosahedron instead');
				var geometry = new THREE.IcosahedronGeometry(10 * controlParameters.Scale, 4);
				mesh = new THREE.Mesh(geometry, material);
				scene.add(mesh);
			});
		} else {
			var geometry;

			if (controlParameters.Geometry == "Torus knot") {
				geometry = new THREE.TorusKnotGeometry(6.5 * controlParameters.Scale, 2.3 * controlParameters.Scale, 256, 32);
			} else if (controlParameters.Geometry == "Sphere") {
				geometry = new THREE.SphereGeometry(10 * controlParameters.Scale, 64, 64);
			} else if (controlParameters.Geometry == "Icosahedron") {
				geometry = new THREE.IcosahedronGeometry(10 * controlParameters.Scale, 4);
			}

			mesh = new THREE.Mesh(geometry, material);
			scene.add(mesh);
		}
	}

	function animate() {
		requestAnimationFrame(animate);
		render();
		stats.update();
	}

	function render() {
		controls.update();
		uniforms.u_time.value = clock.getElapsedTime() * controlParameters.Speed;
		uniforms.u_frame.value += 1.0;
		renderer.render(scene, camera);
	}

	function onWindowResize(event) {
		renderer.setSize(window.innerWidth, window.innerHeight);
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();
		uniforms.u_resolution.value.set(window.innerWidth, window.innerHeight).multiplyScalar(window.devicePixelRatio);
	}

	function onMouseMove(event) {
		uniforms.u_mouse.value.set(event.pageX, window.innerHeight - event.pageY).multiplyScalar(window.devicePixelRatio);
	}

	function onTouchMove(event) {
		uniforms.u_mouse.value.set(event.touches[0].pageX, window.innerHeight - event.touches[0].pageY).multiplyScalar(window.devicePixelRatio);
	}
}
