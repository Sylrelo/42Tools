<script lang="ts">
  import { Chart } from "flowbite-svelte";

  interface ChartData {
    projectName: string;
    level: number;
  }

  export let data: ChartData[] = [];

  let options: ApexCharts.ApexOptions = {
    chart: {
      height: "300px",
      type: "area",
      fontFamily: "Inter, sans-serif",
      dropShadow: {
        enabled: false,
      },
      zoom: {
        enabled: false,
      },
      toolbar: {
        show: false,
      },
      animations: {
        enabled: false,
      },
    },
    tooltip: {
      enabled: true,
      x: {
        show: true,
      },
    },
    fill: {
      type: "gradient",
      gradient: {
        opacityFrom: 0.55,
        opacityTo: 0,
        shade: "#1C64F2",
        gradientToColors: ["#1C64F2"],
      },
    },
    dataLabels: {
      enabled: true,
    },
    stroke: {
      width: 4,
    },
    grid: {
      show: false,
      strokeDashArray: 4,
      // borderColor: "#ffffff",
      padding: {
        left: 2,
        right: 2,
        top: 0,
      },
    },
    series: [
      {
        name: "Level",
        data: [],
        // color: "#1A56DB",
      },
    ],
    xaxis: {
      categories: [],

      labels: {
        show: false,
      },
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
    yaxis: {
      show: false,
    },
  };

  $: if (data) {
    //@ts-ignore
    options.series![0].data = [];
    //@ts-ignore
    options.xaxis.categories = [];

    for (const d of data) {
      //@ts-ignore
      options.series![0].data.push(d.level);
      options.xaxis?.categories.push(d.projectName);
    }
  }
</script>

{#key data}
  <Chart {options} />
{/key}
