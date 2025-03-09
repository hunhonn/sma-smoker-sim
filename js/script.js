var animationDelay = 100;
var simTimer;
var isRunning = false;

var svg;
var bloodPath;
var pathElement;
var pathLength;

var bloodCells = [];
var cellSpeed = 0.0005;
var speedSlider = document.getElementById("slider1");
var veinPathD = "M6.5 103V84.5H23H31.5V49.5H56V25.5H72V6H214.5V24H235V50.5H253V455";

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
}

// Add a new blood cell at the start of the vein (progress = 0)
function addDynamicBloodCell(){
    var cell = { progress: 0 };
    bloodCells.push(cell);
}

// Update the progress of each blood cell along the path
function updateBloodCells(){
    bloodCells.forEach(function(cell) {
        cell.progress += cellSpeed*speedSlider.value;
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
    // Occasionally add a new blood cell (adjust probability as needed)
    if (Math.random() < 0.1){
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