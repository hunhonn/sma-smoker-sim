var animationDelay = 100;
var simTimer;
var isRunning = false;

var svg;
var bloodPath;
var pathElement;
var pathLength;

var bloodCells = [];
var baseBloodCellSpeed = 0.05;
var speedSlider = document.getElementById("slider1");
var veinPathD = "M6.5 103V84.5H23H31.5V49.5H56V25.5H72V6H214.5V24H235V50.5H253V455";

var heartAttackRisk = 0;
var bloodPressure = 1;

window.addEventListener("load", init);

function init() {
    // Create the SVG drawing surface
    svg = d3.select("#bodySurface")
            .attr("width", 600)
            .attr("height", 300);
    
    // Create a group for both path and blood cells
    var veinGroup = svg.append("g")
                       .attr("transform", "translate(260, 220)");
    
    // Append the path to the group
    bloodPath = veinGroup.append("path")
                         .attr("id", "veinPath")
                         .attr("d", veinPathD)
                         .attr("stroke", "#BB2117")
                         .attr("stroke-width", 10)
                         .attr("fill", "none");
    
    // Store the group for later use when adding blood cells
    window.veinGroup = veinGroup;
    
    // Get the DOM element to measure the length of the path
    pathElement = document.getElementById("veinPath");
    pathLength = pathElement.getTotalLength();

    // Set up input event listeners
    document.getElementById("sticks_a_day").addEventListener("input", updateHealthMetrics);

    // Initialize health metrics
    updateHealthMetrics();
}

// ==================== Human Body Characteristics Functions ====================

function updateHealthMetrics() {
    var sticksPerDay = parseFloat(document.getElementById("sticks_a_day").value) || 0;
    
    // Calculate blood pressure: 1.0 is normal, increases by 0.1 per stick
    bloodPressure = 1 + (sticksPerDay * 0.1);
    
    // Calculate heart attack risk: 0-100%, increases non-linearly with sticks
    // Using sigmoid function to create realistic risk curve
    heartAttackRisk = 1 / (1 + Math.exp(-0.5 * (sticksPerDay - 5)));
    
    // Adjust cell speed based on blood pressure
    cellSpeed = baseBloodCellSpeed * bloodPressure;
    
    // Update UI indicators
    updateHealthIndicators();
}

// Function to update visual health indicators
function updateHealthIndicators() {
    // Update blood vessel appearance based on blood pressure
    // bloodPath.attr("stroke", d3.interpolateRgb("#BB2117", "#FF0000")(bloodPressure - 1));
    
    // Display risk values in the insights panel
    var insights = document.getElementById("insights");
    if (insights) {
        insights.innerHTML = "<h3>Health Metrics</h3>" +
                           "<p>Blood Pressure: " + bloodPressure.toFixed(2) + "x normal</p>" +
                           "<p>Heart Attack Risk: " + (heartAttackRisk * 100).toFixed(1) + "%</p>" +
                           "<p>Blood Cell Speed: " + cellSpeed.toFixed(3) + "</p>";
    }
    
    // Implement heart attack at very high risk (optional feature)
    if (heartAttackRisk > 0.9 && Math.random() < heartAttackRisk/100) {
        // Small chance of heart attack if risk is very high
        triggerHeartAttack();
    }
}

// Optional function to simulate a heart attack
function triggerHeartAttack() {
    stopSimulation();
    alert("Heart attack occurred! The simulation will reset.");
    resetSimulation();
}

// ==================== Blood Cell Atributes ====================

function addDynamicBloodCell(){
    var cell = { progress: 0 };
    bloodCells.push(cell);
}

// Update the progress of each blood cell along the path
function updateBloodCells(){
    bloodCells.forEach(function(cell) {
        cell.progress += baseBloodCellSpeed;
    });
    // Remove blood cells that have reached the end of the path
    bloodCells = bloodCells.filter(function(cell) {
        return cell.progress < 1;
    });
}

// Update the positions of the red dots on the SVG drawing surface
function updateSurface(){
    // Bind bloodCells data to circle elements
    var cells = veinGroup.selectAll(".bloodCell").data(bloodCells);
    
    // Remove cells that are no longer in the data array
    cells.exit().remove();
    
    // Add new circle elements for any new blood cells
    var newCells = cells.enter().append("circle")
                         .attr("class", "bloodCell")
                         .attr("r", 5)
                         .attr("fill", "red");
    
    // Position all blood cells along the path based on their progress
    svg.selectAll(".bloodCell")
       .attr("cx", function(d) {
           var point = pathElement.getPointAtLength((d.progress * pathLength));
           return point.x;
       })
       .attr("cy", function(d) {
           var point = pathElement.getPointAtLength((d.progress * pathLength));
           return point.y;
       });
}

// The simulation step: possibly add a new cell, update all cells, and redraw them.
function simStep(){
    if (!isRunning) return;
    
    // Add more cells when blood pressure is higher (more frequent spawning)
    var spawnProbability = 0.1 * bloodPressure;
    if (Math.random() < spawnProbability){
        addDynamicBloodCell();
    }
    
    updateBloodCells();
    updateSurface();
}

// Optional: Functions to control the simulation
function startSimulation() {
    if (!isRunning) {
        // Start the simulation
        simTimer = window.setInterval(simStep, animationDelay);
        isRunning = true;
        document.getElementById("StartORPause").textContent = "Pause";
    } else {
        // Pause the simulation
        window.clearInterval(simTimer);
        isRunning = false;
        document.getElementById("StartORPause").textContent = "Start";
    }
}

function resetSimulation() {
    // Stop the simulation
    if (isRunning) {
        window.clearInterval(simTimer);
        isRunning = false;
        document.getElementById("StartORPause").textContent = "Start";
    }
    
    // Clear all blood cells
    bloodCells = [];
    svg.selectAll(".bloodCell").remove();
}

function stopSimulation() {
    if (isRunning) {
        window.clearInterval(simTimer);
        isRunning = false;
    }
}

function resetSimulation() {
    stopSimulation();
    bloodCells = [];
    svg.selectAll(".bloodCell").remove();
    startSimulation();
}

function openTab(evt, tabName) {
    // Hide all tab content
    var tabcontents = document.getElementsByClassName("tab-content");
    for (var i = 0; i < tabcontents.length; i++) {
        tabcontents[i].classList.remove("active");
    }
    
    // Remove active class from all tab buttons
    var tablinks = document.getElementsByClassName("tab-button");
    for (var i = 0; i < tablinks.length; i++) {
        tablinks[i].classList.remove("active");
    }
    
    // Show the specific tab content
    document.getElementById(tabName).classList.add("active");
    
    // Add active class to the button that opened the tab
    evt.currentTarget.classList.add("active");
}