// Chart.js-based visualization controller
let multiSimHistogramChart;
let lifeExpectancyChart;
let chartData = {
    labels: [], // X-axis (ages)
    datasets: [
        {
            label: "Life Expectancy",
            data: [],
            borderColor: "#BB2117",
            backgroundColor: "rgba(187,33,23,0.1)",
            borderWidth: 3,
            fill: false,
            tension: 0.4
        }
    ]
};

function initCharts() {
    const ctx = document.getElementById('lifeExpectancyChart').getContext('2d');
    lifeExpectancyChart = new Chart(ctx, {
        type: 'line',
        data: chartData,
        options: {
            responsive: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Life Expectancy Trend'
                },
                legend: {
                    display: true
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Age (Years)'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Life Expectancy (Years)'
                    },
                    min: 40,
                    max: 100,
                }
            }
        }
    });
}

let lastPlottedAge = null;

function updateLifeExpectancyChart(currentAge, lifeExpectancy) {
    const ageInt = Math.floor(currentAge);
    if (lastPlottedAge === ageInt) {
        // Skip update if age hasn't increased to a new integer
        return;
    }
    lastPlottedAge = ageInt;

    // Add new data point
    chartData.labels.push(ageInt);
    chartData.datasets[0].data.push(lifeExpectancy);

    // Limit data points for performance (optional)
    const maxPoints = 100;
    if (chartData.labels.length > maxPoints) {
        chartData.labels.shift();
        chartData.datasets.forEach(ds => ds.data.shift());
    }

    lifeExpectancyChart.update();
}

function plotMultiSimHistogram(deathAges) {
    const ctx = document.getElementById('multiSimHistogram').getContext('2d');
    // Bin ages by integer year
    const bins = {};
    deathAges.forEach(age => {
        const rounded = Math.round(age);
        bins[rounded] = (bins[rounded] || 0) + 1;
    });
    const labels = Object.keys(bins).sort((a, b) => a - b);
    const data = labels.map(l => bins[l]);

    if (multiSimHistogramChart) {
        multiSimHistogramChart.destroy();
    }
    multiSimHistogramChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Number of Deaths at Age',
                data: data,
                backgroundColor: 'rgba(187,33,23,0.5)'
            }]
        },
        options: {
            responsive: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Distribution of Age of Death (Multiple Simulations)'
                }
            },
            scales: {
                x: { title: { display: true, text: 'Age of Death' } },
                y: { title: { display: true, text: 'Count' } }
            }
        }
    });
}

// Export functions
window.initCharts = initCharts;
window.updateLifeExpectancyChart = updateLifeExpectancyChart;
window.plotMultiSimHistogram = plotMultiSimHistogram;