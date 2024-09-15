// Elementos para los gráficos y contenedores
const typeChartContainer = document.getElementById('typeChartContainer');
const generatorChartContainer = document.getElementById('generatorChartContainer');
const generationByTypeChartCtx = document.getElementById('generationByTypeChart').getContext('2d');
const generationByGeneratorChartCtx = document.getElementById('generationByGeneratorChart').getContext('2d');

// Formato para mostrar el porcentaje con dos decimales
const percentageFormatter = value => value.toFixed(2) + '%';

// Gráficos iniciales (sin datos)
let generationByTypeChart = new Chart(generationByTypeChartCtx, {
  type: 'doughnut',
  data: {
    labels: [],
    datasets: [{
      label: 'Porcentaje por Tipo de Generación',
      data: [],
      backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
    }]
  },
  options: {
    plugins: {
      tooltip: {
        callbacks: {
          label: function(context) {
            return percentageFormatter(context.raw);
          }
        }
      },
      legend: {
        position: 'bottom',
      }
    }
  }
});

let generationByGeneratorChart = new Chart(generationByGeneratorChartCtx, {
  type: 'bar',
  data: {
    labels: [],
    datasets: [{
      label: 'Porcentaje por Generadora',
      data: [],
      backgroundColor: '#36A2EB',
    }]
  },
  options: {
    plugins: {
      tooltip: {
        callbacks: {
          label: function(context) {
            return percentageFormatter(context.raw);
          }
        }
      },
      legend: {
        display: false,
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return percentageFormatter(value);
          }
        }
      }
    }
  }
});

// Función para manejar el cambio en el selector de tipo de planta
function handleTypeChange(result) {
  const typeSelector = document.getElementById('typeSelector');
  typeSelector.removeEventListener('change', handleTypeChange); // Eliminar evento previo si existe
  typeSelector.addEventListener('change', () => {
    const selectedType = typeSelector.value;
    const generationByGenerator = result.generator_percentage_by_type[selectedType];

    const generators = generationByGenerator.map(item => item.generator);
    const percentagesByGenerator = generationByGenerator.map(item => item.percentage);
    generationByGeneratorChart.data.labels = generators;
    generationByGeneratorChart.data.datasets[0].data = percentagesByGenerator;
    generationByGeneratorChart.update();
  });
}

// Función para actualizar los gráficos con los nuevos datos
async function updateData() {
  try {
    const response = await fetch('/update-data'); // Ruta al backend en Flask
    const result = await response.json();

    if (result.success) {
      // Mostrar los contenedores de las gráficas
      typeChartContainer.style.display = 'block';
      generatorChartContainer.style.display = 'block';

      // Actualizar gráfico de porcentaje por tipo de generación (gráfico de pastel)
      const types = Object.keys(result.type_summary);
      const percentagesByType = Object.values(result.type_summary);
      generationByTypeChart.data.labels = types;
      generationByTypeChart.data.datasets[0].data = percentagesByType;
      generationByTypeChart.update();

      // Poblar el selector de tipos de plantas
      const typeSelector = document.getElementById('typeSelector');
      typeSelector.innerHTML = '<option value="" disabled selected>Seleccione un tipo de planta</option>';
      types.forEach(type => {
        const option = document.createElement('option');
        option.value = type;
        option.textContent = type;
        typeSelector.appendChild(option);
      });

      // Manejar el cambio en el selector de tipo de planta
      handleTypeChange(result);
    } else {
      alert('Error al obtener los datos: ' + result.message);
    }
  } catch (error) {
    console.error('Error en la actualización de datos:', error);
  }
}

// Evento para el botón de actualización
document.getElementById('updateButton').addEventListener('click', updateData);