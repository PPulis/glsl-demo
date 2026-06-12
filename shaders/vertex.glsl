// Vertex Shader
precision highp float;

varying vec3 vPosition;
varying vec3 vNormal;
varying vec2 vUv;

uniform float u_time;

void main() {
	vPosition = position;
	vNormal = normalize(normalMatrix * normal);
	vUv = uv;
	
	vec3 pos = position;
	pos += normal * sin(u_time * 0.5 + position.y * 0.1) * 0.15;
	
	gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
