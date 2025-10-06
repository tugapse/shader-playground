// Function to calculate linear fog factor
float calculateLinearFogFactor(float distance, float fogStart, float fogEnd) {
    // Calculates a linear fog factor based on distance, start, and end points.
    // The factor will be 0.0 (no fog) when distance <= fogStart
    // and 1.0 (full fog) when distance >= fogEnd.
    float fogFactor = (distance - fogStart) / (fogEnd - fogStart);
    return clamp(fogFactor, 0.0, 1.0);
}

// Function to calculate exponential fog factor
float calculateExponentialFogFactor(float distance, float fogDensity) {
    // Calculates an exponential fog factor.
    // Higher density means fog appears closer and thicker.
    // The factor increases exponentially with distance.
    float fogFactor = 1.0 - exp(-distance * fogDensity);
    return clamp(fogFactor, 0.0, 1.0);
}

// New function to apply linear fog to a color
vec3 applyLinearFog(vec3 originalColor, vec3 fogColor, float distance, float fogStart, float fogEnd) {
    // Calculates the linear fog factor and mixes the original color with the fog color.
    float fogFactor = calculateLinearFogFactor(distance, fogStart, fogEnd);
    return mix(originalColor, fogColor, fogFactor);
}

// New function to apply exponential fog to a color
vec3 applyExponentialFog(vec3 originalColor, vec3 fogColor, float distance, float fogDensity) {
    // Calculates the exponential fog factor and mixes the original color with the fog color.
    float fogFactor = calculateExponentialFogFactor(distance, fogDensity);
    return mix(originalColor, fogColor, fogFactor);
}


float rand(vec2 c){
	return fract(sin(dot(c.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

// float noise(vec2 p, float freq ){
// 	float unit = screenWidth/freq;
// 	vec2 ij = floor(p/unit);
// 	vec2 xy = mod(p,unit)/unit;
// 	//xy = 3.*xy*xy-2.*xy*xy*xy;
// 	xy = .5*(1.-cos(PI*xy));
// 	float a = rand((ij+vec2(0.,0.)));
// 	float b = rand((ij+vec2(1.,0.)));
// 	float c = rand((ij+vec2(0.,1.)));
// 	float d = rand((ij+vec2(1.,1.)));
// 	float x1 = mix(a, b, xy.x);
// 	float x2 = mix(c, d, xy.x);
// 	return mix(x1, x2, xy.y);
// }

// float pNoise(vec2 p, int res){
// 	float persistance = .5;
// 	float n = 0.;
// 	float normK = 0.;
// 	float f = 4.;
// 	float amp = 1.;
// 	int iCount = 0;
// 	for (int i = 0; i<50; i++){
// 		n+=amp*noise(p, f);
// 		f*=2.;
// 		normK+=amp;
// 		amp*=persistance;
// 		if (iCount == res) break;
// 		iCount++;
// 	}
// 	float nf = n/normK;
// 	return nf*nf*nf*nf;
// }
