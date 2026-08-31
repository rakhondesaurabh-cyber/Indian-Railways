import React, { useState, useEffect } from 'react';
import { Card, Form, Button, InputGroup, Badge, Spinner, ListGroup } from 'react-bootstrap';
import { Search, Train as TrainIcon, Navigation, CheckCircle, Activity, MapPin } from 'lucide-react';
import type { LiveTrainData } from '../types';

interface LiveTrainTrackerProps {
  onLiveTrainLoaded: (data: LiveTrainData | null) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

const API_URL = 'http://localhost:8000/api';

export function LiveTrainTracker({ onLiveTrainLoaded, loading, setLoading }: LiveTrainTrackerProps) {
  const [trainsDataset, setTrainsDataset] = useState<{ number: string, name: string }[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [liveData, setLiveData] = useState<LiveTrainData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch available trains from dataset for autocomplete/reference
    fetch(`${API_URL}/dataset/trains`)
      .then(res => res.json())
      .then(data => setTrainsDataset(data))
      .catch(err => console.error('Failed to load trains dataset', err));
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) return;

    // Extract number if formatted as "12004 - Shatabdi"
    const numberMatch = searchQuery.match(/^(\w+)/);
    const trainNumber = numberMatch ? numberMatch[1] : searchQuery;

    setLoading(true);
    setError(null);
    try {
      // Fetch live train data
      const res = await fetch(`${API_URL}/trains/${trainNumber}/live`);
      if (!res.ok) {
        throw new Error('Live data not found for this train');
      }
      const result = await res.json();

      // Parse response format which nests data inside 'data' property
      const parsedData = result.data ? result.data : result;
      setLiveData(parsedData);
      onLiveTrainLoaded(parsedData);
    } catch (err: any) {
      setError(err.message);
      setLiveData(null);
      onLiveTrainLoaded(null);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'departed':
        return <Badge bg="success">Departed</Badge>;
      case 'arrived':
        return <Badge bg="primary">Arrived</Badge>;
      case 'upcoming':
        return <Badge bg="secondary">Upcoming</Badge>;
      case 'delayed':
        return <Badge bg="danger">Delayed</Badge>;
      default:
        return <Badge bg="info">{status}</Badge>;
    }
  };

  // Find next station
  const nextStation = liveData?.route?.find(r => r.status === 'upcoming');
  const lastStation = liveData?.route?.slice().reverse().find(r => r.status === 'departed' || r.status === 'arrived');

  return (
    <Card className="shadow-sm border-0 rounded-2 mb-3">
      <Card.Header className="bg-white border-bottom border-primary border-2 py-2 d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center">
          <Activity size={17} className="me-2 text-primary" />
          <span className="fw-bold">Live Train Tracker</span>
        </div>
        {liveData && (
          <Button variant="outline-danger" size="sm" style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem' }} onClick={() => {
            setLiveData(null);
            onLiveTrainLoaded(null);
            setSearchQuery('');
          }}>
            Clear
          </Button>
        )}
      </Card.Header>
      <Card.Body className="p-3">
        <Form onSubmit={handleSearch} className="mb-3">
          <InputGroup size="sm">
            <Form.Control
              placeholder="Enter Train (e.g. 12004)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              list="trainList"
            />
            <datalist id="trainList">
              {trainsDataset.slice(0, 500).map(t => (
                <option key={t.number} value={`${t.number} - ${t.name}`} />
              ))}
            </datalist>
            <Button type="submit" variant="primary" disabled={loading || !searchQuery}>
              {loading ? <Spinner size="sm" animation="border" /> : <Search size={14} />}
            </Button>
          </InputGroup>
          {error && <div className="text-danger extra-small mt-1" style={{ fontSize: '0.75rem' }}>{error}</div>}
        </Form>

        {liveData && (
          <div className="live-train-details">
            <div className="d-flex align-items-center gap-2 mb-2 pb-2 border-bottom">
              <div className="bg-primary bg-opacity-10 p-2 rounded text-primary">
                <TrainIcon size={20} />
              </div>
              <div>
                <div className="fw-bold text-dark">{liveData.train.name}</div>
                <div className="extra-small text-muted" style={{ fontSize: '0.75rem' }}>
                  #{liveData.train.number} • {liveData.train.source?.name} → {liveData.train.destination?.name}
                </div>
              </div>
            </div>

            <div className="d-flex justify-content-between mb-3 bg-light rounded p-2 border">
              <div className="text-center">
                <div className="extra-small text-muted" style={{ fontSize: '0.7rem' }}>PREVIOUS</div>
                <div className="fw-bold small">{lastStation?.stationCode || '--'}</div>
                <div className="extra-small text-success" style={{ fontSize: '0.7rem' }}>{lastStation?.actualDeparture?.split('T')[1]?.substring(0, 5) || '--:--'}</div>
              </div>
              <div className="d-flex align-items-center text-primary px-2">
                <Navigation size={16} />
              </div>
              <div className="text-center">
                <div className="extra-small text-muted" style={{ fontSize: '0.7rem' }}>UPCOMING</div>
                <div className="fw-bold small">{nextStation?.stationCode || '--'}</div>
                <div className="extra-small text-primary" style={{ fontSize: '0.7rem' }}>{nextStation?.scheduledArrival?.split('T')[1]?.substring(0, 5) || '--:--'}</div>
              </div>
            </div>

            <div className="fw-bold small mb-2 d-flex align-items-center gap-1">
              <MapPin size={14} className="text-muted" /> Route Schedule
            </div>

            <div className="custom-scrollbar" style={{ maxHeight: '200px', overflowY: 'auto' }}>
              <ListGroup variant="flush">
                {liveData.route?.filter(r => r.isHalt).map((halt, idx) => (
                  <ListGroup.Item key={idx} className={`p-2 border-0 border-bottom ${halt.status === 'upcoming' ? 'bg-light' : ''}`}>
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <div className="small fw-medium d-flex align-items-center gap-1">
                          {halt.status === 'arrived' || halt.status === 'departed' ?
                            <CheckCircle size={12} className="text-success" /> :
                            <div className="rounded-circle border border-secondary" style={{ width: '10px', height: '10px' }}></div>
                          }
                          {halt.stationName} ({halt.stationCode})
                        </div>
                        <div className="extra-small text-muted ms-3" style={{ fontSize: '0.7rem' }}>
                          Dist: {halt.distance} km | PF: {halt.platform || '-'}
                        </div>
                      </div>
                      <div className="text-end">
                        {getStatusBadge(halt.status)}
                        <div className="extra-small mt-1" style={{ fontSize: '0.7rem' }}>
                          {halt.scheduledArrival?.split('T')[1]?.substring(0, 5) || halt.scheduledDeparture?.split('T')[1]?.substring(0, 5) || '--:--'}
                          {(halt.delayArrival || 0) > 0 && <span className="text-danger ms-1">+{(halt.delayArrival || 0)}m</span>}
                        </div>
                      </div>
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </div>
          </div>
        )}

        {!liveData && !error && (
          <div className="text-center text-muted p-3 my-2 bg-light rounded border border-light-subtle">
            <Activity size={24} className="mb-2 opacity-50 text-primary" />
            <div className="small">Track a train for real-time map overlay</div>
          </div>
        )}
      </Card.Body>
    </Card>
  );
}
