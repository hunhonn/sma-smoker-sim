import { initRespiratorySystem, respiratorySimStep, getLungHealth } from './respiratory.js';
import { socialInfluence, familyInfluence, lifeStressLevel, updateFamilyInfluence, updateLifeStressLevel, updateSmokerFriends } from './social_circle.js';
import { updateMinSmokeAge, updateSugarLevel, updateOilLevel, updatePublicSmokingBan, updateTaxLevel, publicSmokingMultiplier} from './national_policy.js';

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
var strokeRisk = 0;
var cancerRisk = 0;
var bloodPressure = 1;
var heart_oxygen_level = 100;
var heartStress = 0;
// ==================== Parameter Initialization ====================
var currentAge = 25;
const baseLifeExpectancy = 83;
var lifeExpectancy = 80;
var ageProgressionRate = 0.1; // how much age increases per step
var simulationYear = 0; // Years elapsed in simulation
var initialSticksPerDay = 0; // Store initial value
var currentSticksPerDay;
var startSmoking = false; // Flag to track if smoking starts

// ==================== Social Circle Initialization ====================
// var familyInfluence = 0;
// var lifeStressLevel = 0.3;

// ==================== Brain Initialization ====================
var addictionFactor = 0;
var withdrawal_severity =0;
var neuroplasticity_recovery_potential=0;
var cognitive_decline_risk=0;
var cognitiveImpact=0;
// ==================== Govt Intervention Initialization ====================
var govtInterventionLevel = 0;
var adjustedConsumptionFactor = 1; // Default to 1 (no adjustment)

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
    // document.getElementById("govt-intervention-value").textContent = document.getElementById("govt-intervention").value;
    document.getElementById("reco-sugar-value").textContent = document.getElementById("reco-sugar").value;
    document.getElementById("life-stress-value").textContent = document.getElementById("life-stress").value;
    document.getElementById("tax-value").textContent = document.getElementById("tax-slider").value;
    
    //For Graphs
    initCharts();

    // Set up input event listeners
    document.getElementById("age").addEventListener("input", updateInitialAge);
    document.getElementById("sticks_a_day").addEventListener("input", function () {
        updateInitialSticks();
        updateHeartHealth();
    });
    document.getElementById("retirement_age").addEventListener("input", updateRetirementAge);
    document.getElementById("min-age").addEventListener("input", updateMinSmokeAge);

    // event listener for checkbox
    document.getElementById("family-influence").addEventListener("change", function () {
        updateFamilyInfluence(this); // Pass the checkbox element
    });

    document.getElementById("smoker-friends").addEventListener("change", function () {
        updateSmokerFriends(this);
    });

    document.getElementById("public-smoking").addEventListener("change", function () {
        updatePublicSmokingBan(this);
    });

    // event listener for sliders
    // document.getElementById("govt-intervention").addEventListener("input", function () {
    //     govtInterventionLevel = parseFloat(this.value);
    //     updateSliderLabel(this, "govt-intervention-value")
    // });

    document.getElementById("tax-slider").addEventListener("input", function () {
        adjustedConsumptionFactor = updateTaxLevel(this); // Store the factor
        updateTaxLevel(this); // Dynamically update sticks per day
    });

    document.getElementById("reco-sugar").addEventListener("input", function () {
        govtInterventionLevel = parseFloat(this.value);
        updateSliderLabel(this, "reco-sugar-value")
    });

    document.getElementById("life-stress").addEventListener("input", function () {
        updateLifeStressLevel(this);
        // console.log("Life stress level set to:", lifeStressLevel);
    });

    document.getElementById("tax-slider").addEventListener("input", function () {
        updateSliderLabel(this, "tax-value");
    });

    document.getElementById("StartORPause").addEventListener("click", startSimulation);



    // For tabs
    const tabButtons = document.getElementsByClassName("tab-button");
    for (let i = 0; i < tabButtons.length; i++) {
        tabButtons[i].addEventListener("click", function (event) {
            const tabName = this.getAttribute("data-tab"); // You'll need to add this attribute
            openTab(event, tabName);
        });
    }

    // Initialize health metrics
    updateInitialAge();
    updateInitialSticks();
    updateHeartHealth();

    calculateLifeExpectancy(); //Calculate life expectancy
    if (window.updateLifeExpectancyChart) {
        updateLifeExpectancyChart(simulationYear, lifeExpectancy);
    }
}

// ==================== Human Body Characteristics Functions ====================

function updateInitialAge() {
    currentAge = parseFloat(document.getElementById("age").value) || 25;
    simulationYear = 0;
    calculateLifeExpectancy();
}

function updateInitialSticks() {
    initialSticksPerDay = parseFloat(document.getElementById("sticks_a_day").value) || 0;
    if (familyInfluence) {
        // If family influence is present, calculate the probability of starting smoking
        const age = parseFloat(document.getElementById("age").value) || 12;
        const legalAge = parseFloat(document.getElementById("min-age").value) || 21;
        const maxAge = 21;
        const minProbability = 0.05; // 10% chance at age 12
        const maxProbability = 0.7; // 90% chance at age 21

        // Linearly increase probability with age
        const probability = Math.min(
            maxProbability,
            Math.max(0,minProbability + ((currentAge - age) / (maxAge - age)) * (maxProbability - minProbability) - Math.max(0,legalAge-currentAge)*0.2)
        );
        console.log("Probability of starting smoking:", probability);
        console.log("Age:", currentAge);
        // Randomly decide if the person starts smoking
        if (Math.random() < probability) {
            initialSticksPerDay = Math.max(1, parseFloat(document.getElementById("sticks_a_day").value) || 0);
            startSmoking = true; // Set the flag to true if smoking starts
        } else {
            initialSticksPerDay = 0; // No smoking if the random chance fails
        }
    } else {
        // If no family influence, smoking initiation is less likely
        initialSticksPerDay = parseFloat(document.getElementById("sticks_a_day").value) || 0;
    }
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


    // Each cigarette per day reduces life expectancy
    // Research shows heavy smoking (20+ cigarettes/day) can reduce life by 10+ years
    const currentSticks = getCurrentSticks();

    // Start with basic reduction: Each stick reduces life by 20 minutes
    let yearsReduced = currentSticks * (20 / 525600);

    // Additional reduction for smoking after age 40
    if (currentAge > 40 && currentSticks > 0) {
        const yearsSmokingAfter40 = Math.min(simulationYear, currentAge - 40);
        if (yearsSmokingAfter40 > 0) {
            // 0.25 years (3 months) per year smoking after 40
            yearsReduced += yearsSmokingAfter40 * 0.25;
        }
    }

    // Cap reduction based on smoking intensity (10 years for pack-a-day)
    const maxReduction = 10 * (currentSticks / 20);
    yearsReduced = Math.min(yearsReduced, maxReduction);

    // Calculate final life expectancy
    lifeExpectancy = baseLifeExpectancy - yearsReduced;

    // Set upper and lower bounds
    // Upper bound: non-smokers could live up to 90
    const upperBound = baseLifeExpectancy + 7;
    // Lower bound: heavy smokers won't go below 60
    const lowerBound = Math.max(60, currentAge);

    // Apply bounds
    lifeExpectancy = Math.min(upperBound, Math.max(lowerBound, lifeExpectancy));

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

    // Currently sugar intake = government recommended sugar intake
    var recoSugarLevel = parseFloat(document.getElementById("reco-sugar").value);
    var recoOilLevel = parseFloat(document.getElementById("reco-oil").value);
    var cholesterol = 0;

    const lungHealth = getLungHealth();
    const lungCapacity = lungHealth ? lungHealth.capacity : 100;

    // Calculate blood pressure: 1.0 is normal
    // Increases by 0.1 per cigarette stick
    // Increases/decreases by sugar level (0.5 is normal)
    cholesterol = recoOilLevel * 0.1; // Assuming oil level is a proxy for cholesterol
    bloodPressure = 1 + (sticksPerDay * 0.1) + (recoSugarLevel - 0.5) + (cholesterol - 0.5);

    const smokingImpact = sticksPerDay * 0.5;
    const lungImpact = (100 - lungCapacity) * 0.5;

    // Combined impact (weighted to prioritize lung capacity)
    heart_oxygen_level = 100 - (smokingImpact * 0.4) - (lungImpact * 0.6);

    // Ensure oxygen level stays within realistic bounds
    heart_oxygen_level = Math.min(100, Math.max(70, heart_oxygen_level));

    // Calculate heart stress based on both oxygen level and blood pressure
    // Heart stress increases when oxygen is low and blood pressure is high
    // Formula: higher values = more stress (0-100 scale)
    heartStress = ((100 - heart_oxygen_level) * 0.5) + ((bloodPressure - 1) * 30);
    heartStress = Math.min(100, Math.max(0, heartStress)); // Clamp between 0-100

    // Calculate heart attack risk: 0-100%, increases non-linearly with sticks
    // Using sigmoid function to create realistic risk curve

    if (currentAge < 50) {
        heartAttackRisk = 1 / (1 + Math.exp(-0.08 * (heartStress - 40)));
    } else {
        Math.max(heartAttackRisk = 1 / (1 + Math.exp(-0.1 * (heartStress - 35))), heartAttackRisk = 1 / (1 + Math.exp(-0.08 * (heartStress - 40))));
    }

    // Calculate stroke risk: 0-100%, increases with blood pressure
    if (currentAge < 50) { 
        strokeRisk = 1 / (1 + Math.exp(-0.05 * (bloodPressure - 1)));
    } else {
        strokeRisk = Math.max(
            1 / (1 + Math.exp(-0.07 * (bloodPressure - 1))),
            1 / (1 + Math.exp(-0.05 * (bloodPressure - 1)))
        );
    }

    // Calculate stroke risk: 0-100%, increases with blood pressure
    if (currentAge < 50) { 
        cancerRisk = 1 / (1 + Math.exp(-0.05 * (bloodPressure - 1)));
    } else {
        cancerRisk = Math.max(
            1 / (1 + Math.exp(-0.07 * (bloodPressure - 1))),
            1 / (1 + Math.exp(-0.05 * (bloodPressure - 1)))
        );
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
            "<p>Stroke Risk: " + (strokeRisk * 100).toFixed(1) + "%</p>" +
            "<p>Lung Capacity: " + lungHealth.capacity.toFixed(2) + "%</p>" +
            "<p>Tar Accumulation: " + lungHealth.tarAccumulation.toFixed(1) + "%</p>" +
            "<p>Estimated Life Expectancy: " + lifeExpectancy.toFixed(1) + " years</p>" +
            "<p>Years of Life Lost: " + (baseLifeExpectancy - lifeExpectancy).toFixed(1) + "</p>";
    }

    console.log("heartstress", heartStress);
    console.log("heart attack risk", heartAttackRisk);
    console.log("stroke risk", strokeRisk);
    console.log("cancer risk", cancerRisk);
    // console.log(lungHealth.tarAccumulation);
    // Random chance of heart attack based on risk
    if (heartAttackRisk > 0.7 && Math.random() < heartAttackRisk / 50) {
        // if (Math.random() < heartAttackRisk/50) {
        triggerHeartAttack();
    }

    // Random chance of stroke based on risk
    if (strokeRisk > 0.7 && Math.random() < strokeRisk / 50) {
        // if (Math.random() < strokeRisk/50) {
        triggerStroke();
    }

    if (cancerRisk > 0.7 && Math.random() < cancerRisk / 50) {
        // if (Math.random() < cancerRisk/50) {
        triggerCancer();
    }
}

function triggerHeartAttack() {
    const survivalProbability = 0.5; // 50% chance to survive
    if (Math.random() < survivalProbability) {
        alert("Heart attack occurred! The patient survived.");

        // Reduce life expectancy slightly
        lifeExpectancy -= 2; // Decrease life expectancy by 1 year

        // Chance to reduce sticks per day to 1
        if (Math.random() < 0.7) { // 70% chance to reduce to 1 stick per day
            currentSticksPerDay = 1;
            alert("The patient has drastically reduced smoking to 1 stick per day after the heart attack.");
        } else {
            alert("The patient continues smoking at the same rate. He refuses to change his habits.");
        }

        // Update health metrics and indicators
        updateHeartHealth();
        updateHealthIndicators();
    } else {
        stopSimulation();
        document.getElementById("StartORPause").textContent = "Start";
        alert("Heart attack occurred! The patient did not survive.");
        resetSimulation();
    }
}

function triggerStroke() {
    const survivalProbability = 0.5; // 50% chance to survive
    if (Math.random() < survivalProbability) {
        alert("Stroke occurred! The patient survived.");

        // Reduce life expectancy slightly
        lifeExpectancy -= 2; // Decrease life expectancy by 2 years

        // Chance to reduce sticks per day to 1
        if (cognitiveImpact < 0.7 && influenceEffect < 0 ) { // 70% chance to reduce to 1 stick per day
            currentSticksPerDay = 1;
            alert("The patient has drastically reduced smoking to 1 stick per day after the stroke.");
        } else {
            alert("The patient continues smoking at the same rate.");
        }

        // Update health metrics and indicators
        updateHeartHealth();
        updateHealthIndicators();
    } else {
        stopSimulation();
        alert("Stroke occurred! The patient did not survive.");
        resetSimulation();
    }
}

function triggerCancer() {
    const survivalProbability = 0.95; // 95% chance to survive
    if (Math.random() < survivalProbability) {
        alert("Patient has been diagnosed with Stage 1 cancer.");

        // Reduce life expectancy slightly
        lifeExpectancy -= 5; // Decrease life expectancy by 5 years

        // Chance to reduce sticks per day to 1
        if (Math.random() < 0.7) { // 70% chance to reduce to 1 stick per day
            currentSticksPerDay = 1;
            alert("The patient has drastically reduced smoking to 1 stick per day after the cancer diagnosis.");
        } else {
            alert("The patient continues smoking at the same rate.");
        }

        // Update health metrics and indicators
        updateHeartHealth();
        updateHealthIndicators();
    } else {
        stopSimulation();
        alert("Patient has been diagnosed with Stage 4 cancer. The patient passed away soon after.");
        resetSimulation();
    }
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
    } else if (currentAge < 21) {
        stressMultiplier = 1
    } else {
        stressMultiplier = 1.0 + (simulationYear / 30); // Normal stress progression before retirement
    }

    // 1. Personal stress factor (increases with age and existing consumption)
    const stressFactor = lifeStressLevel * 0.1 * stressMultiplier;

    // 2. Family influence (-1 to 1 scale)
    // Negative values decrease smoking, positive values increase
    const influenceEffect = (familyInfluence + socialInfluence) * 0.2;

    // 3. Government intervention (increases in effectiveness over time)
    // const govtEffect = -govtInterventionLevel * 0.1 * (1 + (simulationYear / 10));
    const govtEffect = 1
    // 4. Random life events (can be positive or negative)
    let lifeEventImpact;
    if (currentAge > 21) {
        lifeEventImpact = (Math.random() - 0.5) * 0.2;
    } else {
        lifeEventImpact = 0;
    }
    
    // Check if person started smoking
    if (startSmoking || initialSticksPerDay > 0) {
        // Calculate net change, reduced by addiction (addiction makes it harder to reduce)
        let netChange = stressFactor + influenceEffect + (govtEffect * (1 - addictionFactor)) + lifeEventImpact+ withdrawal_severity; //need tweak life and cognitive 
        // Apply change to current sticks per day
        newSticksPerDay += netChange;
    }
    

    const maxSticks = getMaxCigarettesForAge(currentAge);
    console.log("lifeStressLevel:", lifeStressLevel);
    console.log("stressMultiplier:", stressMultiplier);
    console.log("Stress Factor:", stressFactor);

    // Ensure smoking doesn't go below zero
    return Math.min(maxSticks, Math.max(0, newSticksPerDay));
}

function getMaxCigarettesForAge(age) {
    if (age < 18) {
        return 2;
    } else if (age < 25) {
        return 10;
    } else if (age < 35) {
        return 15;
    } else if (age < 45) {
        return 15;
    } else if (age < 55) {
        return 16;
    } else if (age >= 55) {
        return 14;
    }
}

// ==================== Blood Cell Atributes ====================

function addDynamicBloodCell() {
    var cell = { progress: 0 };
    bloodCells.push(cell);
}

// Update the progress of each blood cell along the path
function updateBloodCells() {
    bloodCells.forEach(function (cell) {
        cell.progress += cellSpeed;
    });
    // Remove blood cells that have reached the end of the path
    bloodCells = bloodCells.filter(function (cell) {
        return cell.progress < 1;
    });
}

// ==================== SIM Core Atributes ====================

function updateSliderLabel(slider, labelId) {
    const value = parseFloat(slider.value);
    document.getElementById(labelId).textContent = value.toFixed(1);
}

// Update the positions of the red dots on the SVG drawing surface
function updateSurface() {
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
        .attr("cx", function (d) {
            var point = pathElement.getPointAtLength((d.progress * pathLength));
            return point.x;
        })
        .attr("cy", function (d) {
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

    document.getElementById("age-value").textContent = currentAge.toFixed(0);

    updatePublicSmokingBan(document.getElementById("public-smoking"));

    // Check if the user has started smoking
    if (!startSmoking) {
        updateInitialSticks();
    }

    let previousSticks = currentSticksPerDay;

    // Update sticks per day based on progression
    currentSticksPerDay = updateSticksPerDay();

    currentSticksPerDay *= adjustedConsumptionFactor;
    currentSticksPerDay *= publicSmokingMultiplier;

    if (currentSticksPerDay > 0) {
        updateCigaretteImage();
    }

    const drop = previousSticks - currentSticksPerDay;
    const exposure = currentSticksPerDay / 20;

    // === Update Withdrawal Severity ===
    if (previousSticks > 0 && currentSticksPerDay < previousSticks) {
        // Withdrawal kicks in when there's a drop in consumption
        withdrawal_severity = Math.min(1, withdrawal_severity + (drop / 20) * addictionFactor); // Scale based on drop and addiction
        neuroplasticity_recovery_potential = Math.min(1, neuroplasticity_recovery_potential + 0.01);
    } else if ( currentSticksPerDay > 0) {
        const declineRate = 0.002 * (1.2 - neuroplasticity_recovery_potential); // more risk if recovery is low
        cognitive_decline_risk = Math.min(1, cognitive_decline_risk + declineRate * exposure);
        neuroplasticity_recovery_potential = Math.max(0.3, neuroplasticity_recovery_potential - 0.001 * exposure);// Brain recovery decreases
        withdrawal_severity = Math.max(0, withdrawal_severity - 0.01);// If no reduction or still smoking, slowly ease withdrawal
    }else {
        // Fully quit: withdrawal easing and brain recovery
        withdrawal_severity = Math.max(0, withdrawal_severity - 0.02);
        neuroplasticity_recovery_potential = Math.min(1, neuroplasticity_recovery_potential + 0.02);
        const healing = 0.005 * neuroplasticity_recovery_potential;
        cognitive_decline_risk = Math.max(0, cognitive_decline_risk - healing);
    }
    const cognitive_decline = (cognitive_decline_risk * 0.01) + (withdrawal_severity * 0.005) - (neuroplasticity_recovery_potential * 0.005);
    cognitiveImpact = Math.min(1, Math.max(0, cognitive_decline + cognitiveImpact));

    // Update health metrics
    updateHeartHealth();

    // Update the life expectancy chart with new data
    if (window.updateLifeExpectancyChart) {
        updateLifeExpectancyChart(currentAge, lifeExpectancy);
    }

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

    console.log("Simulation Year:", simulationYear);
    console.log("Current Age:", currentAge);
    console.log("Previous Sticks Per Day:", previousSticks);
    console.log("Updated Sticks Per Day (before adjustment):", currentSticksPerDay);
    console.log("Adjusted Consumption Factor:", adjustedConsumptionFactor);
    console.log("Updated Sticks Per Day (after adjustment):", currentSticksPerDay);

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
        // console.log("started sim with", currentSticksPerDay, "sticks per day");
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
    currentSticksPerDay = SticksPerDay; // Reset current sticks to initial value
    currentAge = parseFloat(document.getElementById("age").value) || 12;
    simulationYear = 0;

    // Reset the chart data
    if (window.DataViz) {
        DataViz.resetData('lifeExpectancy');
    }

    // Update displays
    updateHeartHealth();
    calculateLifeExpectancy();

    // Update the chart with initial values
    if (window.updateLifeExpectancyChart) {
        updateLifeExpectancyChart(currentAge, lifeExpectancy);
    }

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

function updateCigaretteImage() {
    const imageContainer = document.getElementById("cigarette-image");

    if (parseFloat(currentSticksPerDay.toFixed(1)) > 0) {
        imageContainer.innerHTML = `<img src="/public/img/cig.png" alt="Cigarette" style="width: 50px; height: auto;">`;
    } else {
        imageContainer.innerHTML = ""; // Clear the image if sticks per day is 0
    }
}

export {
    getCurrentSticks,
    startSimulation,
    resetSimulation,
    updateHeartHealth,
    updateSliderLabel,
    startSmoking,
    simulationYear
}