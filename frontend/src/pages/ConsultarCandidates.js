import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button, Spinner } from 'react-bootstrap';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useNavigate } from 'react-router-dom';

const STEP_LABELS = {
  1: 'Initial Screening',
  2: 'Technical Interview',
  3: 'Manager Interview'
};

const ConsultarCandidates = () => {
  const navigate = useNavigate();
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3010';

  const fetchCandidates = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = `${API_BASE}/positions/1/candidates`;
      const res = await fetch(url);

      if (!res.ok) {
        // Try to read text safely (could be HTML index page)
        const text = await res.text().catch(() => res.statusText);
        throw new Error(text || res.statusText);
      }

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        const text = await res.text().catch(() => '<non-json response>');
        throw new Error('Expected JSON response from API but received: ' + text);
      }

      const data = await res.json();
      setCards(data);
    } catch (err) {
      setError(err.message || 'Error fetching candidates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCandidates(); }, []);

  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return; // dropped outside
    const from = parseInt(source.droppableId);
    const to = parseInt(destination.droppableId);
    if (from === to) return; // nothing changed

    // draggableId is in format '<step>-app-<applicationId>'
    const applicationId = parseInt(draggableId.split('-').slice(-1)[0]);
    const item = cards.find(c => c.applicationId === applicationId);
    if (!item) return;
    const candidateId = item.candidateId;

    try {
      // optimistic update
      setCards(prev => prev.map(c => c.applicationId === applicationId ? { ...c, currentInterviewStep: to } : c));

      const res = await fetch(`${API_BASE}/candidates/${candidateId}/stage`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId, newStepId: to })
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || body.message || res.statusText);
      }

      // refresh list to ensure consistency
      await fetchCandidates();
    } catch (err) {
      // rollback optimistic update
      await fetchCandidates();
      alert('Error moving candidate: ' + (err.message || err));
    }
  };

  const renderColumn = (step) => {
    const items = cards.filter(c => c.currentInterviewStep === step);
    return (
      <Col key={step}>
        <h5 className="text-center">{STEP_LABELS[step] || `Step ${step}`}</h5>
        <Droppable droppableId={String(step)}>
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps} style={{ minHeight: '300px' }}>
              {items.map((item, index) => {
                const dId = `${step}-app-${item.applicationId}`;
                return (
                  <Draggable key={dId} draggableId={dId} index={index}>
                    {(prov) => (
                      <div ref={prov.innerRef} {...prov.draggableProps} {...prov.dragHandleProps}>
                        <Card className="mb-2">
                          <Card.Body>
                            <Card.Title>{item.fullName}</Card.Title>
                            <Card.Subtitle className="mb-2 text-muted">Score: {item.averageScore ?? '—'}</Card.Subtitle>
                            <Card.Text style={{ fontSize: 12 }}>Last interview: {item.lastInterviewDate ?? '—'}</Card.Text>
                          </Card.Body>
                        </Card>
                      </div>
                    )}
                  </Draggable>
                );
              })}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </Col>
    );
  };

  return (
    <Container className="mt-4">
      <Row className="mb-3">
        <Col><h3>Consultar Candidatos</h3></Col>
        <Col className="text-end"><Button variant="secondary" size="sm" onClick={() => navigate('/')}>Back to Dashboard</Button></Col>
      </Row>

      {loading ? (
        <div className="text-center"><Spinner animation="border" /></div>
      ) : error ? (
        <div className="alert alert-danger">{error}</div>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <Row>
            {renderColumn(1)}
            {renderColumn(2)}
            {renderColumn(3)}
          </Row>
        </DragDropContext>
      )}
    </Container>
  );
};

export default ConsultarCandidates;
