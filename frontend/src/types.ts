export interface StationNode {
  id: string;
  name: string;
  code: string;
  zone?: string;
  lat: number;
  lng: number;
  type?: string;
  is_junction?: boolean;
  train_count?: number;
  degree?: number;
}

export interface TrackEdge {
  id: string;
  source: string;
  target: string;
  travel_time_mins: number;
  distance_km?: number;
  daily_trains?: number;
}

export interface RailwayNetwork {
  nodes: StationNode[];
  edges: TrackEdge[];
  total_stations?: number;
  total_edges?: number;
  total_trains?: number;
  mode?: 'major' | 'hdn' | 'full';
}

export interface StationSearchResult {
  code: string;
  name: string;
  lat: number;
  lng: number;
  zone?: string;
  is_junction?: boolean;
  train_count?: number;
}

export interface CorridorStation {
  code: string;
  name: string;
  lat: number;
  lng: number;
  zone?: string;
  is_junction?: boolean;
  sequence: number;
  distance_km: number;
}

export interface CorridorTrainDetail {
  train_id: string;
  train_number: string;
  train_name: string;
  name: string;
  type: string;
  priority: string;
  origin: string;
  origin_name?: string;
  destination: string;
  destination_name?: string;
  departure_time: string;
  arrival_time: string;
  direction: 'forward' | 'reverse' | string;
  status: string;
  delay_mins: number;
  subroute?: string[];
}

export interface CorridorSearchResult {
  status: string;
  corridor_id: string;
  from_station: {
    code: string;
    name: string;
    lat: number;
    lng: number;
    zone?: string;
  };
  to_station: {
    code: string;
    name: string;
    lat: number;
    lng: number;
    zone?: string;
  };
  total_distance_km: number;
  avg_travel_time_mins: number;
  stations: CorridorStation[];
  stations_count: number;
  track_coordinates: [number, number][];
  trains: CorridorTrainDetail[];
  trains_count: number;
  active_blocks: MaintenanceRequest[];
}

export interface Train {
  id: string;
  train_number?: string;
  train_name?: string;
  name?: string;
  type: string;
  priority: 'High' | 'Medium' | 'Low' | string;
  route: string[];
  origin?: string;
  origin_name?: string;
  destination?: string;
  destination_name?: string;
  start_time: string;
  status: string;
  halts_count?: number;
  total_distance?: number;
  current_lat?: number;
  current_lng?: number;
  current_segment?: string;
}

export interface AffectedTrain {
  train_id: string;
  train_number: string;
  train_name: string;
  name: string;
  type: string;
  priority: 'High' | 'Medium' | 'Low' | string;
  delay_mins: number;
  asset_id: string;
  maintenance_id?: string;
  start_cross?: string;
  end_cross?: string;
  start_cross_time?: string;
  end_cross_time?: string;
  origin?: string;
  destination?: string;
  route?: string[];
  status?: string;
}

export interface UnaffectedTrain {
  train_id: string;
  train_number: string;
  train_name: string;
  name: string;
  type: string;
  priority: 'High' | 'Medium' | 'Low' | string;
  origin?: string;
  destination?: string;
  route?: string[];
  start_time: string;
  status: string;
  delay_mins: number;
}

export interface MaintenanceRequest {
  id: string;
  asset_id: string;
  type: string;
  duration_mins: number;
  priority: 'Critical' | 'High' | 'Medium' | 'Low' | string;
  deadline: string;
  status: string;
}

export interface CorridorTrain {
  train_id: string;
  train_number: string;
  train_name: string;
  name: string;
  type: string;
  priority: 'High' | 'Medium' | 'Low' | string;
  asset_id: string;
  maintenance_id?: string;
  start_cross: string;
  end_cross: string;
  start_cross_time: string;
  end_cross_time: string;
  is_delayed: boolean;
  delay_mins: number;
  status_label: string;
  status_code: 'delayed' | 'before_block' | 'after_block' | string;
  origin?: string;
  destination?: string;
  route?: string[];
  status?: string;
}

export interface AiExplanation {
  section_name: string;
  time_window: string;
  reasons: string[];
  optimization_score: number;
}

export interface ScheduledBlock {
  maintenance_id: string;
  asset_id: string;
  start_time: string;
  end_time: string;
  affected_trains: string[];
  affected_train_details?: AffectedTrain[];
  corridor_trains?: CorridorTrain[];
  delay_caused: number;
  ml_predicted_delay?: number;
  ml_risk_level?: string;
  option_id?: string;
  ai_explanation?: AiExplanation;
}

export interface OptimizationMetrics {
  before: {
    trains_affected: number;
    delay_mins: number;
  };
  after: {
    trains_affected: number;
    delay_mins: number;
    ml_predicted_delay_mins?: number;
    ml_risk_score?: string;
  };
}

export interface CandidateOption {
  id: string;
  label: string;
  badge: string;
  rationale: string;
  start_time: string;
  end_time: string;
  affected_trains: string[];
  affected_train_details?: AffectedTrain[];
  corridor_trains?: CorridorTrain[];
  delay_caused: number;
  ml_predicted_delay?: number;
  ml_risk_level?: string;
  ai_explanation?: AiExplanation;
}

export interface CandidatePlanMetrics {
  trains_affected: number;
  delay_mins: number;
  ml_predicted_delay_mins?: number;
  ml_risk_score?: string;
}

export interface DispatchDirective {
  id: string;
  type: 'LOOP_HOLD' | 'TSLW_WORKING' | 'CHORD_DETOUR' | string;
  severity: 'CRITICAL' | 'WARNING' | 'ADVISORY' | string;
  target_station: string;
  target_station_code: string;
  assigned_line: string;
  held_train: {
    number: string;
    name: string;
    type: string;
    priority: string;
  };
  precedence_train: {
    number: string;
    name: string;
    priority: string;
  };
  holding_window: {
    start: string;
    end: string;
    duration_mins: number;
  };
  action_title: string;
  action_instruction: string;
  delay_saved_mins: number;
  coa_memo_text: string;
  acknowledged?: boolean;
}

export interface DispatchStats {
  total_directives: number;
  loop_holds: number;
  tslw_orders: number;
  chord_detours: number;
  total_delay_saved_mins: number;
}

export interface CandidatePlan {
  id: string;
  name: string;
  description: string;
  badge?: string;
  plan: (ScheduledBlock & { option_id?: string })[];
  metrics: CandidatePlanMetrics;
  ai_explanation?: AiExplanation;
  ai_explanations?: AiExplanation[];
  affected_trains?: AffectedTrain[];
  unaffected_trains?: UnaffectedTrain[];
  corridor_trains_by_asset?: Record<string, CorridorTrain[]>;
  total_trains_count?: number;
  affected_trains_count?: number;
  unaffected_trains_count?: number;
  dispatch_directives?: DispatchDirective[];
  dispatch_stats?: DispatchStats;
}

export interface BreakdownByMaintenance {
  maintenance_request: MaintenanceRequest;
  options: CandidateOption[];
}

export interface OptimizationResponse {
  status: string;
  message: string;
  recommended_plan_id?: string;
  candidate_plans?: CandidatePlan[];
  breakdown_by_maintenance?: Record<string, BreakdownByMaintenance>;
  plan: ScheduledBlock[];
  ai_explanation?: AiExplanation;
  ai_explanations?: AiExplanation[];
  metrics: OptimizationMetrics;
  affected_trains?: AffectedTrain[];
  unaffected_trains?: UnaffectedTrain[];
  corridor_trains_by_asset?: Record<string, CorridorTrain[]>;
  total_trains_count?: number;
  affected_trains_count?: number;
  unaffected_trains_count?: number;
  dispatch_directives?: DispatchDirective[];
  dispatch_stats?: DispatchStats;
}

export interface LiveTrainHalt {
  sequence: number;
  stationCode: string;
  stationName: string;
  isHalt: boolean;
  status: string;
  scheduledArrival?: string;
  actualArrival?: string;
  delayArrival?: number;
  scheduledDeparture?: string;
  actualDeparture?: string;
  delayDeparture?: number;
  distance: number;
  platform?: string;
}

export interface LiveTrainData {
  train: {
    number: string;
    name: string;
    type?: string;
    source: { code: string; name: string };
    destination: { code: string; name: string };
  };
  current_status?: {
    status: string;
    current_station?: string;
    delay_mins?: number;
  };
  route: LiveTrainHalt[];
  meta?: {
    timestamp: string;
  };
}

export type UserRole = 'HEAD' | 'OPERATOR';

export interface RailwayUser {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  assignedZone: string; // 'ALL' for Head, or 'CR', 'NR', 'WR', etc.
  designation: string;
  sectionName?: string;
  createdAt?: string;
}

