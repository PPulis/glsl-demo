// Fragment Shader
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
	
	// Create color based on position and time
	vec3 color = vec3(0.0);
	color += 0.5 + 0.5 * sin(u_time * 0.5 + vPosition.x * 0.3);
	color += 0.5 + 0.5 * cos(u_time * 0.3 + vPosition.y * 0.3);
	color += 0.5 + 0.5 * sin(u_time * 0.7 + vPosition.z * 0.3);
	
	// Normalize color
	color = normalize(color);
	
	// Add fresnel effect
	vec3 viewDir = normalize(cameraPosition - vPosition);
	float fresnel = pow(1.0 - abs(dot(normal, viewDir)), 3.0);
	color += fresnel * 0.4;
	
	// Add specular highlight
	vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));
	float specular = pow(max(dot(reflect(-lightDir, normal), viewDir), 0.0), 32.0);
	color += specular * vec3(1.0, 0.8, 0.6) * 0.5;
	
	gl_FragColor = vec4(color, 1.0);
}
