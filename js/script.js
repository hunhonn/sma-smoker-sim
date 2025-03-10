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

var currentAge = 25;
var lifeExpectancy = 80;
var ageProgressionRate = 0.1; // how much age increases per step
var stickProgressionRate = 0.1; // How much sticks per day increases per step
var simulationYear = 0; // Years elapsed in simulation
var initialSticksPerDay = 0; // Store initial value
var currentSticksPerDay = 0;



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
    document.getElementById("age").addEventListener("input", updateInitialAge);
    document.getElementById("sticks_a_day").addEventListener("input", function() {
        updateInitialSticks(); // Add this line to update the initial sticks value
        updateHealthMetrics();
    });

    // Initialize health metrics
    updateInitialAge();
    updateInitialSticks();
    updateHealthMetrics();

    calculateLifeExpectancy(); //Calculate life expectancy
}

// ==================== Human Body Characteristics Functions ====================

function updateInitialAge() {
    currentAge = parseFloat(document.getElementById("age").value) || 25;
    simulationYear = 0;
    calculateLifeExpectancy();
}

function updateInitialSticks() {
    initialSticksPerDay = parseFloat(document.getElementById("sticks_a_day").value) || 0;
    calculateLifeExpectancy();
}

// Function to calculate life expectancy based on smoking habits
function calculateLifeExpectancy() {
    // Base life expectancy (for non-smokers)
    const baseLifeExpectancy = 80;
    
    // Each cigarette per day reduces life expectancy
    // Research shows heavy smoking (20+ cigarettes/day) can reduce life by 10+ years
    const currentSticks = getCurrentSticks();
    const yearsReduced = currentSticks * 0.5; // Each stick reduces life by 6 months
    
    lifeExpectancy = baseLifeExpectancy - yearsReduced;
    
    // Minimum life expectancy
    if (lifeExpectancy < currentAge + 5) {
        lifeExpectancy = currentAge + 5;
    }
    
    return lifeExpectancy;
}

// Get current number of cigarettes per day based on simulation progression
function getCurrentSticks() {
    return isRunning ? currentSticksPerDay : initialSticksPerDay;
}

function updateHealthMetrics() {
    // Use the tracked value when simulation is running, otherwise use input value
    var sticksPerDay = isRunning ? currentSticksPerDay : 
                       parseFloat(document.getElementById("sticks_a_day").value) || 0;
    
    // Calculate blood pressure: 1.0 is normal, increases by 0.1 per stick
    bloodPressure = 1 + (sticksPerDay * 0.1);
    
    // Calculate heart attack risk: 0-100%, increases non-linearly with sticks
    // Using sigmoid function to create realistic risk curve
    heartAttackRisk = 1 / (1 + Math.exp(-0.5 * (sticksPerDay - 5)));
    
    // Adjust cell speed based on blood pressure
    cellSpeed = baseBloodCellSpeed * bloodPressure;
    
    // Recalculate life expectancy
    calculateLifeExpectancy();
    
    // Only update visuals if simulation is running
    if (isRunning) {
        updateHealthIndicators();
    }
}

// Function to update visual health indicators
function updateHealthIndicators() {
    // Update blood vessel appearance based on blood pressure
    bloodPath.attr("stroke", d3.interpolateRgb("#BB2117", "#fe0204")(bloodPressure - 1));
    // bloodPath.attr("stroke-width", 10 + (bloodPressure - 1) * 10)
    // .attr("stroke", d3.interpolateRgb("#BB2117", "#fe0204")(bloodPressure - 1));
    
    // Display risk values in the insights panel
    var insights = document.getElementById("insights");
    if (insights) {
        insights.innerHTML = "<h3>Health Metrics</h3>" +
                           "<p>Current Age: " + currentAge.toFixed(1) + "</p>" +
                           "<p>Years Simulated: " + simulationYear.toFixed(1) + "</p>" +
                           "<p>Cigarettes/Day: " + currentSticksPerDay.toFixed(1) + "</p>" +
                           "<p>Blood Pressure: " + bloodPressure.toFixed(2) + "x normal</p>" +
                           "<p>Heart Attack Risk: " + (heartAttackRisk * 100).toFixed(1) + "%</p>" +
                           "<p>Estimated Life Expectancy: " + lifeExpectancy.toFixed(1) + " years</p>" +
                           "<p>Years of Life Lost: " + (80 - lifeExpectancy).toFixed(1) + "</p>";
    }
    
    // Random chance of heart attack based on risk
    console.log(heartAttackRisk)
    if (heartAttackRisk > 0.5 && Math.random() < heartAttackRisk/50) {
        triggerHeartAttack();
    }
}

// Optional function to simulate a heart attack
function triggerHeartAttack() {
    stopSimulation();
    document.getElementById("StartORPause").textContent = "Start";
    alert("Heart attack occurred! The simulation has been stopped.");
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
// Modify the simStep function to update age and check for end condition
function simStep() {
    if (!isRunning) return;
    
    // Update simulation time and smoking habit
    simulationYear += ageProgressionRate;
    currentAge = parseFloat(document.getElementById("age").value) + simulationYear;
    
    // Update sticks per day based on progression
    currentSticksPerDay = Math.min(10, initialSticksPerDay + (simulationYear * stickProgressionRate));
    // Update health metrics
    updateHealthMetrics();
    
    // Check if we've reached life expectancy
    if (currentAge >= lifeExpectancy) {
        endSimulation();
        return;
    }
    
    // Regular simulation steps
    var spawnProbability = 0.1 * bloodPressure;
    if (Math.random() < spawnProbability) {
        addDynamicBloodCell();
    }
    
    updateBloodCells();
    updateSurface();
}

// End simulation when life expectancy is reached
function endSimulation() {
    stopSimulation();
    alert(`Simulation ended: Subject reached end of life expectancy at age ${currentAge.toFixed(1)}`);
    
    // Display final insights
    var insights = document.getElementById("insights");
    if (insights) {
        insights.innerHTML += "<h3>SIMULATION ENDED</h3>" +
                             "<p>Life expectancy reached.</p>" +
                             "<p>Final age: " + currentAge.toFixed(1) + "</p>" +
                             "<p>Years of life lost due to smoking: " + 
                                (80 - lifeExpectancy).toFixed(1) + "</p>";
    }
}

// Optional: Functions to control the simulation
function startSimulation() {
    if (!isRunning) {
        // initialSticksPerDay = parseFloat(document.getElementById("sticks_a_day").value) || 0;
        // Start the simulation
        simTimer = window.setInterval(simStep, animationDelay);
        isRunning = true;
        document.getElementById("StartORPause").textContent = "Pause";
        
        // Update initial indicators now that simulation has started
        updateHealthIndicators();
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
    
    // Reset simulation values
    bloodCells = [];
    svg.selectAll(".bloodCell").remove();
    simulationYear = 0;
    document.getElementById("sticks_a_day").value = initialSticksPerDay;
    currentAge = parseFloat(document.getElementById("age").value) || 25;
    
    // Update displays
    updateHealthMetrics();
}

function stopSimulation() {
    if (isRunning) {
        window.clearInterval(simTimer);
        isRunning = false;
    }
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