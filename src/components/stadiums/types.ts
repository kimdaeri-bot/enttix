import React from 'react';

export interface PathSection {
  id: string;
  label: string;
  type: 'path';
  d: string;
  labelX: number;
  labelY: number;
}

export interface RectSection {
  id: string;
  label: string;
  type: 'rect';
  x: number;
  y: number;
  w: number;
  h: number;
  rx2?: number;
  labelX: number;
  labelY: number;
}

export type StadiumSection = PathSection | RectSection;

export interface SectionProps {
  section: StadiumSection;
  fill: string;
  fillOpacity: number;
  stroke: string;
  strokeWidth: number;
  showLabel: boolean;
}

export interface StadiumModule {
  VIEWBOX: string;
  SECTIONS: StadiumSection[];
  Field: () => React.ReactElement;
  Section: (props: SectionProps) => React.ReactElement;
}
