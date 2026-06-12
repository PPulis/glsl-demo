// Simple OrbitControls implementation
var OrbitControls = function(object, domElement) {
	this.object = object;
	this.domElement = domElement;
	this.autoRotate = false;
	this.autoRotateSpeed = 2;
	this.enablePan = false;
	
	var euler = new THREE.Euler(0, 0, 0, 'YXZ');
	var PI_2 = Math.PI / 2;
	var v = new THREE.Vector3();
	var spherical = new THREE.Spherical();
	
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

	/*
	 * Loads the shader files
	 */
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

	/*
	 * Initializes the sketch
	 */
	function init() {
		// Initialize the WebGL renderer
		renderer = new THREE.WebGLRenderer({
			antialias : true,
			alpha: true
		});
		renderer.setPixelRatio(window.devicePixelRatio);
		renderer.setSize(window.innerWidth, window.innerHeight);
		renderer.setClearColor(new THREE.Color(0, 0, 0), 1);

		// Add the renderer to the sketch container
		var container = document.getElementById("sketch-container");
		container.appendChild(renderer.domElement);

		// Initialize the scene
		scene = new THREE.Scene();

		// Initialize the camera
		camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 5000);
		camera.position.z = 30;

		// Initialize the camera controls
		controls = new OrbitControls(camera, renderer.domElement);
		controls.enablePan = false;
		controls.autoRotate = true;
		controls.autoRotateSpeed = 2;

		// Initialize the clock
		clock = new THREE.Clock(true);

		// Initialize the statistics monitor and add it to the sketch container
		stats = new Stats();
		stats.dom.style.cssText = "position:absolute;top:20px;right:20px;";
		document.body.appendChild(stats.dom);

		// Initialize the control parameters
		controlParameters = {
			"Geometry" : "Torus knot",
			"Speed": 1.0,
			"Scale": 1.0
		};

		// Add the control panel to the sketch
		addControlPanel();

		// Define the shader uniforms
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

		// Create the shader material
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

		// Create the mesh and add it to the scene
		addMeshToScene();

		// Add the event listeners
		window.addEventListener("resize", onWindowResize, false);
		renderer.domElement.addEventListener("mousemove", onMouseMove, false);
		renderer.domElement.addEventListener("touchstart", onTouchMove, false);
		renderer.domElement.addEventListener("touchmove", onTouchMove, false);
	}

	/*
	 * Adds the control panel to the sketch
	 */
	function addControlPanel() {
		// Create the control panel
		var controlPanel = new dat.GUI({
			autoPlace : true
		});

		// Add the controllers
		controlPanel.add(controlParameters, "Geometry", [ "Torus knot", "Sphere", "Icosahedron", "Suzanne" ])
				.onFinishChange(addMeshToScene);
		controlPanel.add(controlParameters, "Speed", 0.1, 5.0, 0.1);
		controlPanel.add(controlParameters, "Scale", 0.5, 2.0, 0.1).onFinishChange(addMeshToScene);

		// Add the GUI to the correct DOM element
		document.getElementById("sketch-gui").appendChild(controlPanel.domElement);
	}

	/*
	 * Adds the mesh to the scene
	 */
	function addMeshToScene() {
		// Remove any previous mesh from the scene
		if (mesh) {
			scene.remove(mesh);
		}

		// Handle all the different options
		if (controlParameters.Geometry == "Suzanne") {
			// Load the json file that contains the geometry
			var loader = new THREE.BufferGeometryLoader();
			loader.load("objects/suzanne_buffergeometry.json", function(geometry) {
				// Scale the geometry
				geometry.scale(10 * controlParameters.Scale, 10 * controlParameters.Scale, 10 * controlParameters.Scale);

				// Calculate the vertex normals
				geometry.computeVertexNormals();

				// Create the mesh and add it to the scene
				mesh = new THREE.Mesh(geometry, material);
				scene.add(mesh);
			}, undefined, function(error) {
				console.warn('Suzanne geometry not found, using Icosahedron instead');
				// Fallback to Icosahedron
				var geometry = new THREE.IcosahedronGeometry(10 * controlParameters.Scale, 4);
				mesh = new THREE.Mesh(geometry, material);
				scene.add(mesh);
			});
		} else {
			// Create the desired geometry
			var geometry;

			if (controlParameters.Geometry == "Torus knot") {
				geometry = new THREE.TorusKnotGeometry(6.5 * controlParameters.Scale, 2.3 * controlParameters.Scale, 256, 32);
			} else if (controlParameters.Geometry == "Sphere") {
				geometry = new THREE.SphereGeometry(10 * controlParameters.Scale, 64, 64);
			} else if (controlParameters.Geometry == "Icosahedron") {
				geometry = new THREE.IcosahedronGeometry(10 * controlParameters.Scale, 4);
			}

			// Create the mesh and add it to the scene
			mesh = new THREE.Mesh(geometry, material);
			scene.add(mesh);
		}
	}

	/*
	 * Animates the sketch
	 */
	function animate() {
		requestAnimationFrame(animate);
		render();
		stats.update();
	}

	/*
	 * Renders the sketch
	 */
	function render() {
		controls.update();
		uniforms.u_time.value = clock.getElapsedTime() * controlParameters.Speed;
		uniforms.u_frame.value += 1.0;
		renderer.render(scene, camera);
	}

	/*
	 * Updates the renderer size, the camera aspect ratio and the uniforms when the window is resized
	 */
	function onWindowResize(event) {
		// Update the renderer
		renderer.setSize(window.innerWidth, window.innerHeight);

		// Update the camera
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();

		// Update the resolution uniform
		uniforms.u_resolution.value.set(window.innerWidth, window.innerHeight).multiplyScalar(window.devicePixelRatio);
	}

	/*
	 * Updates the uniforms when the mouse moves
	 */
	function onMouseMove(event) {
		// Update the mouse uniform
		uniforms.u_mouse.value.set(event.pageX, window.innerHeight - event.pageY).multiplyScalar(
				window.devicePixelRatio);
	}

	/*
	 * Updates the uniforms when the touch moves
	 */
	function onTouchMove(event) {
		// Update the mouse uniform
		uniforms.u_mouse.value.set(event.touches[0].pageX, window.innerHeight - event.touches[0].pageY).multiplyScalar(
				window.devicePixelRatio);
	}
}
