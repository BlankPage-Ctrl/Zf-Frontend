<script setup lang="ts">
import { computed } from 'vue';
import ContainerCell from './ContainerCell.vue';
import type { ContainerColumnConfig, ContainerRowConfig, SizeValue } from './types';

type Props = {
  readonly rows: ReadonlyArray<ContainerRowConfig>;
  readonly rowGap?: SizeValue;
  readonly colGap?: SizeValue;
  readonly animate?: boolean;
  readonly animationMs?: number;
};

const props = withDefaults(defineProps<Props>(), {
  rowGap: 0,
  colGap: 0,
  animate: false,
  animationMs: 180,
});

const toCssSize = (value?: SizeValue): string | undefined => {
  if (value === undefined) return undefined;
  return typeof value === 'number' ? `${value}px` : value;
};

const getVisibleColumns = (row: ContainerRowConfig): ReadonlyArray<ContainerColumnConfig> => {
  return row.columns.filter((column) => column.visible !== false);
};

const visibleRows = computed(() => {
  return props.rows.filter((row) => getVisibleColumns(row).length > 0);
});

const getColumnTemplate = (row: ContainerRowConfig): string => {
  const columns = getVisibleColumns(row);
  if (columns.length === 0) return '1fr';

  return columns
    .map((column) => toCssSize(column.width) ?? '1fr')
    .join(' ');
};

const gridStyle = computed(() => {
  const rows = visibleRows.value;
  const template = rows.length
    ? rows.map((row) => toCssSize(row.height) ?? '1fr').join(' ')
    : '1fr';

  return {
    gridTemplateRows: template,
    rowGap: toCssSize(props.rowGap),
    transition: props.animate ? `grid-template-rows ${props.animationMs}ms ease` : undefined,
  };
});

const getRowStyle = (row: ContainerRowConfig) => {
  return {
    gridTemplateColumns: getColumnTemplate(row),
    columnGap: toCssSize(row.columnGap ?? props.colGap),
    transition: props.animate ? `grid-template-columns ${props.animationMs}ms ease` : undefined,
  };
};
</script>

<template>
  <div class="container-grid" :style="gridStyle">
    <div
      v-for="row in visibleRows"
      :key="row.id"
      class="container-row"
      :style="getRowStyle(row)"
      :data-row="row.id"
    >
      <ContainerCell
        v-for="column in getVisibleColumns(row)"
        :key="column.id"
        :cell-id="column.id"
        :style-config="column.cell"
        :resizable="column.resizable ?? false"
        :animate="props.animate"
        :animation-ms="props.animationMs"
      >
        <slot :name="column.id" />
      </ContainerCell>
    </div>
  </div>
</template>

<style scoped>
.container-grid {
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  display: grid;
}

.container-row {
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  display: grid;
  align-items: stretch;
}

.container-row > * {
  min-width: 0;
  min-height: 0;
}

/* Unified Scrollbar Styling */
:deep(.container-cell::-webkit-scrollbar) {
  width: 3px;
  height: 3px;
}

:deep(.container-cell::-webkit-scrollbar-track) {
  background: transparent;
}

:deep(.container-cell::-webkit-scrollbar-thumb) {
  background: rgba(var(--primary-lighting), 0.3);
  border-radius: 2px;
}

:deep(.container-cell::-webkit-scrollbar-thumb:hover) {
  background: rgba(var(--primary-lighting), 0.5);
}
</style>
