import React, { useState, useEffect } from 'react';
import { Modal, Table, Spinner, Badge, Alert, Row, Col } from 'react-bootstrap';
import { MapPin, Train as TrainIcon, Navigation } from 'lucide-react';

interface TrainScheduleProps {
  show: boolean;
  onHide: () => void;
  trainNumber: string | null;
  trainName?: string;
}

interface Station {
  code: string;
  name: string;
  lat: number;
  lng: number;
}

interface RouteStop {
  sequence: number;
  station: Station;
  isHalt: boolean;
  platform?: string;
  arrival?: string;
  arrivalDay?: number;
  departure?: string;
  departureDay?: number;
  distance: number;
  speedToNextStationKmph?: number;
}

interface TrainData {
  number: string;
  name: string;
  type: string;
  zone: string;
  origin: string;
  destination: string;
  distance: number;
  duration: number;
  avgSpeed: number;
  totalHalts: number;
  coachPosition?: string;
}

interface ScheduleResponse {
  success: boolean;
  data: {
    train: TrainData;
    route: RouteStop[];
  };
  error?: string;
}

export const TrainScheduleModal: React.FC<TrainScheduleProps> = ({ show, onHide, trainNumber, trainName }) => {
  const [loading, setLoading] = useState(false);
  const [scheduleData, setScheduleData] = useState<ScheduleResponse['data'] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (show && trainNumber) {
      fetchSchedule(trainNumber);
    } else {
      setScheduleData(null);
      setError(null);
    }
  }, [show, trainNumber]);

  const fetchSchedule = async (num: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://localhost:8000/api/trains/${num}/schedule`);
      const data = await response.json();
      
      if (response.ok && data.success) {
        setScheduleData(data.data);
      } else {
        setError(data.detail || 'Failed to load schedule.');
      }
    } catch (err) {
      setError('Network error while fetching schedule.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (time?: string, day?: number) => {
    if (!time) return '-';
    return (
      <div className="d-flex flex-column">
        <span className="fw-bold">{time}</span>
        {day && <span className="extra-small text-muted" style={{ fontSize: '0.7rem' }}>Day {day}</span>}
      </div>
    );
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered backdrop="static" className="railradar-modal">
      <Modal.Header closeButton className="bg-primary text-white border-bottom-0 rounded-top">
        <Modal.Title className="d-flex align-items-center gap-2">
          <TrainIcon size={24} />
          <div>
            <div className="fw-bold m-0" style={{ fontSize: '1.2rem' }}>
              {scheduleData ? scheduleData.train.name : (trainName || 'Train Schedule')}
              {scheduleData && <Badge bg="light" text="dark" className="ms-2 fs-6">#{scheduleData.train.number}</Badge>}
            </div>
            <div className="extra-small text-white-50 fw-normal" style={{ fontSize: '0.8rem' }}>
              Powered by RailRadar API
            </div>
          </div>
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body className="p-0 bg-light">
        {loading ? (
          <div className="d-flex flex-column justify-content-center align-items-center py-5">
            <Spinner animation="border" variant="primary" className="mb-3" />
            <span className="text-muted fw-semibold">Fetching live schedule from RailRadar...</span>
          </div>
        ) : error ? (
          <div className="p-4">
            <Alert variant="danger">
              <Alert.Heading>Error Loading Schedule</Alert.Heading>
              <p>{error}</p>
            </Alert>
          </div>
        ) : scheduleData ? (
          <div className="d-flex flex-column h-100">
            {/* Train Info Banner */}
            <div className="bg-white border-bottom p-3 shadow-sm">
              <Row className="g-3">
                <Col md={3} sm={6}>
                  <div className="text-muted extra-small text-uppercase fw-bold mb-1">Route</div>
                  <div className="fw-semibold text-dark d-flex align-items-center gap-1">
                    {scheduleData.train.origin} <Navigation size={12} className="text-primary"/> {scheduleData.train.destination}
                  </div>
                </Col>
                <Col md={3} sm={6}>
                  <div className="text-muted extra-small text-uppercase fw-bold mb-1">Distance & Time</div>
                  <div className="fw-semibold text-dark">
                    {scheduleData.train.distance} km • {Math.floor(scheduleData.train.duration / 60)}h {scheduleData.train.duration % 60}m
                  </div>
                </Col>
                <Col md={3} sm={6}>
                  <div className="text-muted extra-small text-uppercase fw-bold mb-1">Type</div>
                  <div className="fw-semibold text-dark">
                    <Badge bg="info" className="text-dark">{scheduleData.train.type}</Badge>
                  </div>
                </Col>
                <Col md={3} sm={6}>
                  <div className="text-muted extra-small text-uppercase fw-bold mb-1">Avg Speed</div>
                  <div className="fw-semibold text-dark">
                    {scheduleData.train.avgSpeed} km/h
                  </div>
                </Col>
              </Row>
              {scheduleData.train.coachPosition && (
                <div className="mt-3 pt-2 border-top">
                  <div className="text-muted extra-small text-uppercase fw-bold mb-1">Coach Position</div>
                  <div className="extra-small font-monospace bg-light p-2 rounded border">
                    {scheduleData.train.coachPosition}
                  </div>
                </div>
              )}
            </div>

            {/* Timetable */}
            <div className="p-3" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              <h6 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                <MapPin size={16} className="text-primary" /> Route & Halts ({scheduleData.train.totalHalts} stops)
              </h6>
              
              <Table responsive hover className="align-middle bg-white border rounded shadow-sm">
                <thead className="table-light">
                  <tr>
                    <th className="text-center" style={{ width: '60px' }}>#</th>
                    <th>Station</th>
                    <th className="text-center">Arr / Dep</th>
                    <th className="text-center">Halt</th>
                    <th className="text-center">Dist (km)</th>
                    <th className="text-center">PF</th>
                  </tr>
                </thead>
                <tbody>
                  {scheduleData.route.map((stop, idx) => {
                    const haltMins = (stop.arrival && stop.departure) ? (() => {
                      const [ah, am] = stop.arrival.split(':').map(Number);
                      const [dh, dm] = stop.departure.split(':').map(Number);
                      let diff = (dh * 60 + dm) - (ah * 60 + am);
                      if (diff < 0) diff += 24 * 60;
                      return diff;
                    })() : 0;

                    return (
                      <tr key={idx} className={idx === 0 || idx === scheduleData.route.length - 1 ? "table-primary table-opacity-10" : ""}>
                        <td className="text-center fw-bold text-muted">{stop.sequence}</td>
                        <td>
                          <div className="fw-bold text-dark">{stop.station.name}</div>
                          <div className="extra-small text-muted text-uppercase">{stop.station.code}</div>
                        </td>
                        <td className="text-center">
                          <div className="d-flex align-items-center justify-content-center gap-2">
                            {formatTime(stop.arrival, stop.arrivalDay)}
                            <span className="text-muted">-</span>
                            {formatTime(stop.departure, stop.departureDay)}
                          </div>
                        </td>
                        <td className="text-center">
                          {haltMins > 0 ? (
                            <Badge bg="secondary" className="fw-normal">{haltMins} m</Badge>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>
                        <td className="text-center text-muted fw-semibold">{stop.distance}</td>
                        <td className="text-center">
                          {stop.platform ? (
                            <Badge bg="dark" pill>{stop.platform}</Badge>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
          </div>
        ) : null}
      </Modal.Body>
    </Modal>
  );
};
