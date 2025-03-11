import { initRespiratorySystem, respiratorySimStep, getLungHealth } from './respiratory.js';

var animationDelay = 100;
var simTimer;
var isRunning = false;

var svg;
var bloodPath;
var pathElement;
var pathLength;

// ==================== Heart Initialization ====================
var bloodCells = [];
var baseBloodCellSpeed = 0.05;
var cellSpeed = baseBloodCellSpeed; // Add this line
var speedSlider = document.getElementById("slider1");
var veinPathD = "M175 210V150H380V800";

var heartAttackRisk = 0;
var bloodPressure = 1;
var heart_oxygen_level = 100;
var heartStress = 0;
// ==================== Parameter Initialization ====================
var currentAge = 25;
var lifeExpectancy = 80;
var ageProgressionRate = 0.1; // how much age increases per step
var simulationYear = 0; // Years elapsed in simulation
var initialSticksPerDay = 0; // Store initial value
var currentSticksPerDay;

// ==================== Social Circle Initialization ====================
var familyInfluence = 0;
var lifeStressLevel = 0.3;

// ==================== Brain Initialization ====================
var addictionFactor = 0;
// ==================== Govt Intervention Initialization ====================
var govtInterventionLevel = 0;
var retirementAge = 63; //default
// ==================== Initialization ====================

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

    initRespiratorySystem(svg);

    // Initialize span values for sliders
    document.getElementById("family-influence-value").textContent = document.getElementById("family-influence").value;
    document.getElementById("govt-intervention-value").textContent = document.getElementById("govt-intervention").value;
    document.getElementById("life-stress-value").textContent = document.getElementById("life-stress").value;

    // Set up input event listeners
    document.getElementById("age").addEventListener("input", updateInitialAge);
    document.getElementById("sticks_a_day").addEventListener("input", function() {
        updateInitialSticks();
        updateHeartHealth();
    });
    document.getElementById("retirement_age").addEventListener("input", updateRetirementAge);

    // Add event listeners for the sliders
    document.getElementById("family-influence").addEventListener("input", function() {
        familyInfluence = parseFloat(this.value);
        updateSliderLabel(this, "family-influence-value");
        // console.log("Family influence set to:", familyInfluence);
    });
    
    document.getElementById("govt-intervention").addEventListener("input", function() {
        govtInterventionLevel = parseFloat(this.value);
        updateSliderLabel(this, "govt-intervention-value")
    });
    
    document.getElementById("life-stress").addEventListener("input", function() {
        lifeStressLevel = parseFloat(this.value);
        updateSliderLabel(this, "life-stress-value")
        // console.log("Life stress level set to:", lifeStressLevel);
    });
    
    document.getElementById("StartORPause").addEventListener("click", startSimulation);
    
    // For tabs
    const tabButtons = document.getElementsByClassName("tab-button");
    for (let i = 0; i < tabButtons.length; i++) {
        tabButtons[i].addEventListener("click", function(event) {
            const tabName = this.getAttribute("data-tab"); // You'll need to add this attribute
            openTab(event, tabName);
        });
    }

    // Initialize health metrics
    updateInitialAge();
    updateInitialSticks();
    updateHeartHealth();

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
    currentSticksPerDay = initialSticksPerDay;
    calculateLifeExpectancy();
}

function updateRetirementAge() {
    retirementAge = parseFloat(document.getElementById("retirement_age").value) || 63;
    console.log("Retirement age set to:", retirementAge);
}

// Function to calculate life expectancy based on smoking habits
function calculateLifeExpectancy() {
    // Base life expectancy (for non-smokers)
    const baseLifeExpectancy = 80;
    
    // Each cigarette per day reduces life expectancy
    // Research shows heavy smoking (20+ cigarettes/day) can reduce life by 10+ years
    const currentSticks = getCurrentSticks();
    const yearsReduced = currentSticks *(0.000456621/12); // Each stick reduces life by 20 minutes
    // console.log("years reduced ",yearsReduced)
    
    lifeExpectancy = baseLifeExpectancy - yearsReduced;
    
    return lifeExpectancy;
}

// Get current number of cigarettes per day based on simulation progression
function getCurrentSticks() {
    return isRunning ? currentSticksPerDay : initialSticksPerDay;
}

function updateHeartHealth() {
    // Use the tracked value when simulation is running, otherwise use input value
    var sticksPerDay = isRunning ? currentSticksPerDay : 
                       parseFloat(document.getElementById("sticks_a_day").value) || 0;
    
    // Calculate blood pressure: 1.0 is normal, increases by 0.1 per stick
    bloodPressure = 1 + (sticksPerDay * 0.1);
    
    heart_oxygen_level = 100 - (sticksPerDay * 0.0005);

    // Calculate heart stress based on both oxygen level and blood pressure
    // Heart stress increases when oxygen is low and blood pressure is high
    // Formula: higher values = more stress (0-100 scale)
    heartStress = ((100 - heart_oxygen_level) * 0.5) + ((bloodPressure - 1) * 30);
    heartStress = Math.min(100, Math.max(0, heartStress)); // Clamp between 0-100

    // Calculate heart attack risk: 0-100%, increases non-linearly with sticks
    // Using sigmoid function to create realistic risk curve

    if (currentAge <  50){
        heartAttackRisk = 1 / (1 + Math.exp(-0.08 * (heartStress - 50)));
    } else {
        Math.max(heartAttackRisk = 1 / (1 + Math.exp(-0.1 * (heartStress - 45))),heartAttackRisk = 1 / (1 + Math.exp(-0.08 * (heartStress - 50))));
    }

    
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

    var lungHealth = getLungHealth();
    
    // Display risk values in the insights panel
    var insights = document.getElementById("insights");
    if (insights) {
        insights.innerHTML = "<h3>Health Metrics</h3>" +
                           "<p>Current Age: " + currentAge.toFixed(1) + "</p>" +
                           "<p>Years Simulated: " + simulationYear.toFixed(1) + "</p>" +
                           "<p>Cigarettes/Day: " + currentSticksPerDay.toFixed(1) + "</p>" +
                           "<p>Blood Pressure: " + bloodPressure.toFixed(2) + "x normal</p>" +
                           "<p>Heart Attack Risk: " + (heartAttackRisk * 100).toFixed(1) + "%</p>" +
                           "<p>Lung Capacity: " + lungHealth.capacity.toFixed(2) + "%</p>" +
                           "<p>Tar Accumulation: " + lungHealth.tarAccumulation.toFixed(1) + "%</p>" +
                           "<p>Estimated Life Expectancy: " + lifeExpectancy.toFixed(1) + " years</p>" +
                           "<p>Years of Life Lost: " + (80 - lifeExpectancy).toFixed(1) + "</p>";
    }
    
    console.log("heartstress",heartStress);
    console.log("heart attack risk",heartAttackRisk);
    // Random chance of heart attack based on risk
    if (heartAttackRisk > 0.7 && Math.random() < heartAttackRisk/50) {
    // if (Math.random() < heartAttackRisk/50) {
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

// Function to update number of cigs
function updateSticksPerDay() {
    // Base progression from initial habits
    let newSticksPerDay = currentSticksPerDay;
    
    // Update addiction factor (makes it harder to quit the longer you smoke)
    addictionFactor = Math.min(1, addictionFactor + (0.01 * simulationYear * (currentSticksPerDay / 20)));

    let stressMultiplier;
    if (currentAge >= retirementAge) {
        // Gradually reduce stress after retirement (down to 50% of normal stress)
        stressMultiplier = Math.max(0.5, 1.0 - ((currentAge - 63) / 20));
    } else {
        stressMultiplier = 1.0 + (simulationYear / 30); // Normal stress progression before retirement
    }
    
    // 1. Personal stress factor (increases with age and existing consumption)
    const stressFactor = lifeStressLevel * 0.3 * stressMultiplier;
    
    // 2. Family influence (-1 to 1 scale)
    // Negative values decrease smoking, positive values increase
    const familyEffect = familyInfluence * 0.2;
    
    // 3. Government intervention (increases in effectiveness over time)
    const govtEffect = -govtInterventionLevel * 0.1 * (1 + (simulationYear / 10));
    
    // 4. Random life events (can be positive or negative)
    const lifeEventImpact = (Math.random() - 0.5) * 0.2;
    
    // Calculate net change, reduced by addiction (addiction makes it harder to reduce)
    let netChange = stressFactor + familyEffect + (govtEffect * (1 - addictionFactor)) + lifeEventImpact;
    
    // Apply change to current sticks per day
    newSticksPerDay += netChange;
    
    // Ensure smoking doesn't go below zero
    return Math.max(0, newSticksPerDay);
}

// ==================== Blood Cell Atributes ====================

function addDynamicBloodCell(){
    var cell = { progress: 0 };
    bloodCells.push(cell);
}

// Update the progress of each blood cell along the path
function updateBloodCells(){
    bloodCells.forEach(function(cell) {
        cell.progress += cellSpeed;
    });
    // Remove blood cells that have reached the end of the path
    bloodCells = bloodCells.filter(function(cell) {
        return cell.progress < 1;
    });
}

// ==================== SIM Core Atributes ====================

function updateSliderLabel(slider, labelId) {
    const value = parseFloat(slider.value);
    document.getElementById(labelId).textContent = value.toFixed(1);
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
    currentSticksPerDay = updateSticksPerDay();
    // Update health metrics
    updateHeartHealth();
    
    // Check if we've reached life expectancy
    if (currentAge >= lifeExpectancy) {
        endSimulation();
        return;
    }

    respiratorySimStep(isRunning, currentSticksPerDay);
    
    // Regular simulation steps
    var spawnProbability = 0.1 * bloodPressure;
    if (Math.random() < spawnProbability) {
        addDynamicBloodCell();
    }
    
    updateBloodCells();
    updateSurface();
}

// ==================== UI Atributes ====================

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
        currentSticksPerDay = parseFloat(document.getElementById("sticks_a_day").value) || 0;
        console.log("started sim with", currentSticksPerDay, "sticks per day");
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
    initialSticksPerDay = parseFloat(document.getElementById("sticks_a_day").value) || 0;
    currentSticksPerDay = initialSticksPerDay; // Reset current sticks to initial value
    currentAge = parseFloat(document.getElementById("age").value) || 25;
    
    // Update displays
    updateHeartHealth();
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