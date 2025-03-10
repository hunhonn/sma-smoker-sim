// Respiratory system simulation for the smoker simulator
var airwayPathD = "M18 185.5V209H5V225.5H45.5V155.5H80.5V144.5H101.5V40.5";
var airwayPath;
var airwayElement;
var airwayLength;
var airParticles = [];
var baseAirParticleSpeed = 0.03;
var lungCapacity = 100; // percentage
var tarAccumulation = 0; // percentage
var lungDamage = 0; // percentage
var lungGroup;

window.addEventListener("load", initRespiratorySystem);
// Function to initialize the respiratory system
function initRespiratorySystem(svg) {
    if (!svg) {
        console.error("No SVG provided to initRespiratorySystem");
        return;
    }
    lungGroup = svg.append("g")
                  .attr("transform", "translate(175, 150)"); // Position it appropriately

    // Define the airway path - this is a simplified bronchial tree
    // var airwayPathD = "M0,0 C10,50 -10,100 0,150 C5,170 15,180 30,190 M0,150 C-5,170 -15,180 -30,190";

    // Append the airway path
    airwayPath = lungGroup.append("path")
                        .attr("id", "airwayPath")
                        .attr("d", airwayPathD)
                        .attr("stroke", "#FF9899") // Light blue color
                        .attr("stroke-width", 8)
                        .attr("fill", "none");


    // Get the DOM element to measure path length
    airwayElement = document.getElementById("airwayPath");
    airwayLength = airwayElement ? airwayElement.getTotalLength() : 100;
}

// Function to add a new air particle (could be clean air or smoke)
function addAirParticle(isSmoke) {
    var particle = { 
        progress: 1,
        isSmoke: isSmoke || false // Track if it's smoke or clean air
    };
    airParticles.push(particle);
}

// Update the respiratory system based on smoking habits
function respiratorySimStep(isRunning, sticksPerDay) {
    if (!isRunning) return;
    
    // Potentially add new particles
    // Higher chance of smoke particles based on sticks per day
    if (Math.random() < 0.1) {
        // Determine if this is smoke based on sticks per day
        var isSmoke = Math.random() < (sticksPerDay / 10);
        addAirParticle(isSmoke);
    }
    
    // Update existing particles
    updateAirParticles();
    
    // Update lung health based on smoking
    updateLungHealth(sticksPerDay);
    
    // Update visual appearance
    updateLungAppearance();
}

// Update air particles movement
function updateAirParticles() {
    // Move particles along the airway
    airParticles.forEach(function(particle) {
        particle.progress -= baseAirParticleSpeed;
    });
    
    // Remove particles that have reached lungs or been exhaled
    airParticles = airParticles.filter(function(particle) {
        // If reached end of airway (lungs)
        if (particle.progress <= 0) {
            // If it's smoke, accumulate damage
            if (particle.isSmoke) {
                tarAccumulation += 0.1;
            }
            return false;
        }
        return true;
    });
    
    // Update particle positions on screen
    updateRespiratorySystem();
}

// Update lung health based on smoking habits
function updateLungHealth(sticksPerDay) {
    // Lung capacity decreases with tar accumulation
    lungCapacity = Math.max(60, 100 - (tarAccumulation * 0.05));
    
    // Tar accumulation increases with smoking, slight natural cleaning occurs
    tarAccumulation = Math.min(100, tarAccumulation + (sticksPerDay * 0.02) - 0.01);
    
    // Lung damage increases with tar accumulation
    lungDamage = Math.min(100, tarAccumulation * 0.8);
}

// Update the visualization
function updateRespiratorySystem() {
    if (!lungGroup) return;
    
    // Update air particles
    var particles = lungGroup.selectAll(".airParticle")
                           .data(airParticles);
    
    // Remove old particles
    particles.exit().remove();
    
    // Add new particles
    particles.enter()
        .append("circle")
        .attr("class", "airParticle")
        .attr("r", 3)
        .attr("fill", function(d) {
            return d.isSmoke ? "#555" : "#fff"; // Gray for smoke, white for clean air
        });
    
    // Position all particles along the airway path
    lungGroup.selectAll(".airParticle")
        .attr("cx", function(d) {
            if (airwayElement) {
                var point = airwayElement.getPointAtLength(d.progress * airwayLength);
                return point.x;
            }
            return 0;
        })
        .attr("cy", function(d) {
            if (airwayElement) {
                var point = airwayElement.getPointAtLength(d.progress * airwayLength);
                return point.y;
            }
            return 0;
        });
}

// Update lung appearance based on health
function updateLungAppearance() {
    if (!lungGroup) return;
    
    // Calculate color based on tar accumulation
    var healthyColor = "#f8e6e6"; // Light pink
    var damagedColor = "#4d4d4d"; // Dark gray
    
    // Linear interpolation between healthy and damaged color
    var damageRatio = tarAccumulation / 100;
    var r = Math.floor(248 * (1 - damageRatio) + 77 * damageRatio);
    var g = Math.floor(230 * (1 - damageRatio) + 77 * damageRatio);
    var b = Math.floor(230 * (1 - damageRatio) + 77 * damageRatio);
    
    var lungColor = "rgb(" + r + "," + g + "," + b + ")";
    
    // Update lung color
    lungGroup.selectAll(".lung")
           .attr("fill", lungColor);
    
    // Update lung size based on capacity
    var capacityRatio = lungCapacity / 100;
    lungGroup.select(".right-lung")
           .attr("rx", 40 * capacityRatio)
           .attr("ry", 60 * capacityRatio);
           
    lungGroup.select(".left-lung")
           .attr("rx", 40 * capacityRatio)
           .attr("ry", 60 * capacityRatio);
}

// Function to get lung health metrics for displaying in UI
function getLungHealth() {
    return {
        capacity: lungCapacity,
        tarAccumulation: tarAccumulation,
        damage: lungDamage
    };
}

// Export functions to be used in main script
export {
    initRespiratorySystem,
    respiratorySimStep,
    updateRespiratorySystem,
    getLungHealth
};