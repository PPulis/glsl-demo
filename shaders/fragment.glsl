// Fragment Shader
// Replace this with your actual fragment shader code

precision highp float;

varying vec3 vPosition;
varying vec3 vNormal;
varying vec2 vUv;

uniform float u_time;
uniform float u_frame;
uniform vec2 u_resolution;
uniform vec2 u_mouse;

void main() {
	vec3 normal = normalize(vNormal);
	vec3 color = mix(
		vec3(0.2, 0.5, 1.0),
		vec3(1.0, 0.2, 0.8),
		sin(u_time + vPosition.x) * 0.5 + 0.5
	);
	
	float fresnel = pow(1.0 - abs(dot(normal, vec3(0.0, 0.0, 1.0))), 2.0);
	color += vec3(fresnel) * 0.3;
	
	gl_FragColor = vec4(color, 1.0);
}
