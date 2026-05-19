import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { schedulesService } from '../../schedulesService';
import { SORT_DIRECTION, createTableQuery } from '../../../../shared/lib/tableQuery';

const INITIAL_FORM = {
  dias_seleccionados: ['lunes'],
  hora_inicio: '',
  hora_fin: '',
  categorias_seleccionadas: ['iniciacion_hombres'],
  aplicar_todos_dias: false,
  descripcion: '',
};

const EMPTY_MESSAGE = { type: '', text: '' };

export const useHorariosManager = ({ days }) => {
  const timeoutRef = useRef(null);

  const [horarios, setHorarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [filterDay, setFilterDay] = useState('todos');
  const [filterCategory, setFilterCategory] = useState('todos');
  const [sortField, setSortField] = useState('dia_semana');
  const [sortDirection, setSortDirection] = useState(SORT_DIRECTION.ASC);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [message, setMessage] = useState(EMPTY_MESSAGE);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, scheduleId: null });

  const clearMessageTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const showMessage = useCallback((type, text) => {
    clearMessageTimer();
    setMessage({ type, text });
    timeoutRef.current = setTimeout(() => {
      setMessage((current) => (current.text === text ? EMPTY_MESSAGE : current));
      timeoutRef.current = null;
    }, 5000);
  }, [clearMessageTimer]);

  useEffect(() => () => clearMessageTimer(), [clearMessageTimer]);

  const getDescripcionPorDefecto = useCallback((categoria) => {
    const descripciones = {
      iniciacion_hombres:
        'Perfecto para quienes se inician en el voleibol. Aprende fundamentos basicos como recepcion, saque y posicionamiento.',
      iniciacion_mujeres:
        'Ideal para principiantes que quieren aprender voleibol desde cero en un ambiente motivador.',
      perfeccionamiento_hombres:
        'Para jugadores con experiencia que buscan mejorar tecnica y tactica de juego.',
      perfeccionamiento_mujeres:
        'Entrenamiento avanzado para jugadoras con bases solidas y enfoque competitivo.',
      master_mujeres:
        'Categoria especial para atletas mayores de 18 anos con experiencia previa.',
      open_gym:
        'Sesion de juego libre para todos los niveles con enfoque recreativo y competitivo.',
    };
    return descripciones[categoria] || '';
  }, []);

  const fetchHorarios = useCallback(async () => {
    try {
      setLoading(true);
      const sorted = await schedulesService.loadHorarios({
        query: createTableQuery({
          filters: {
            dia_semana: filterDay,
            categoria: filterCategory,
          },
          sort: {
            field: sortField,
            direction: sortDirection,
          },
          pagination: {
            page: 1,
            pageSize: 200,
          },
        }),
      });
      setHorarios(sorted);
    } catch (error) {
      console.error('Error al cargar horarios:', error);
      showMessage('error', `Error al cargar los horarios: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [filterCategory, filterDay, showMessage, sortDirection, sortField]);

  const resetFilters = useCallback(() => {
    setFilterDay('todos');
    setFilterCategory('todos');
    setSortField('dia_semana');
    setSortDirection(SORT_DIRECTION.ASC);
  }, []);

  useEffect(() => {
    fetchHorarios();
  }, [fetchHorarios]);

  const resetForm = useCallback(() => {
    setFormData(INITIAL_FORM);
    setEditingId(null);
    setShowForm(false);
  }, []);

  const toggleFormVisibility = useCallback(() => {
    if (showForm) {
      resetForm();
      return;
    }
    setEditingId(null);
    setFormData(INITIAL_FORM);
    setShowForm(true);
  }, [resetForm, showForm]);

  const validateFormData = useCallback(() => {
    if (!formData.hora_inicio || !formData.hora_fin) {
      return 'Por favor completa todos los campos requeridos';
    }

    if (formData.hora_inicio >= formData.hora_fin) {
      return 'La hora de inicio debe ser anterior a la hora de fin';
    }

    if (formData.categorias_seleccionadas.length === 0) {
      return 'Debes seleccionar al menos una categoria';
    }

    if (!formData.aplicar_todos_dias && formData.dias_seleccionados.length === 0) {
      return 'Debes seleccionar al menos un dia';
    }

    return null;
  }, [formData]);

  const handleSubmit = useCallback(async (event) => {
    event.preventDefault();

    const validationError = validateFormData();
    if (validationError) {
      showMessage('error', validationError);
      return;
    }

    try {
      if (editingId) {
        const { descripcionOmitida } = await schedulesService.updateHorario({
          scheduleId: editingId,
          hora_inicio: formData.hora_inicio,
          hora_fin: formData.hora_fin,
          categoria: formData.categorias_seleccionadas[0],
          descripcion: formData.descripcion || getDescripcionPorDefecto(formData.categorias_seleccionadas[0]),
        });

        showMessage(
          'success',
          descripcionOmitida
            ? 'Horario actualizado. Nota: la descripcion no se guardo porque la columna no existe en BD.'
            : 'Horario actualizado exitosamente'
        );
      } else {
        const diasParaCrear = formData.aplicar_todos_dias ? days.map((day) => day.value) : formData.dias_seleccionados;
        const { totalCreados, descripcionOmitida } = await schedulesService.createHorarios({
          diasParaCrear,
          categorias: formData.categorias_seleccionadas,
          hora_inicio: formData.hora_inicio,
          hora_fin: formData.hora_fin,
          descripcionResolver: (categoria) => formData.descripcion || getDescripcionPorDefecto(categoria),
        });

        showMessage(
          'success',
          descripcionOmitida
            ? `${totalCreados} horario(s) creados. Nota: la descripcion no se guardo porque la columna no existe en BD.`
            : `${totalCreados} horario(s) creados exitosamente`
        );
      }

      resetForm();
      await fetchHorarios();
    } catch (error) {
      console.error('Error al guardar horario:', error);
      showMessage('error', `Error al guardar el horario: ${error.message}`);
    }
  }, [days, editingId, fetchHorarios, formData, getDescripcionPorDefecto, resetForm, showMessage, validateFormData]);

  const handleEdit = useCallback((horario) => {
    setFormData({
      dias_seleccionados: [horario.dia_semana],
      hora_inicio: horario.hora_inicio,
      hora_fin: horario.hora_fin,
      categorias_seleccionadas: [horario.categoria],
      aplicar_todos_dias: false,
      descripcion: horario.descripcion || getDescripcionPorDefecto(horario.categoria),
    });
    setEditingId(horario.id);
    setShowForm(true);
  }, [getDescripcionPorDefecto]);

  const requestDeleteHorario = useCallback((scheduleId) => {
    setDeleteDialog({ open: true, scheduleId });
  }, []);

  const cancelDeleteHorario = useCallback(() => {
    setDeleteDialog({ open: false, scheduleId: null });
  }, []);

  const confirmDeleteHorario = useCallback(async () => {
    const scheduleId = deleteDialog.scheduleId;
    cancelDeleteHorario();
    if (!scheduleId) return;

    try {
      await schedulesService.deleteHorario({ scheduleId });
      showMessage('success', 'Horario eliminado exitosamente');
      await fetchHorarios();
    } catch (error) {
      console.error('Error al eliminar horario:', error);
      showMessage('error', `Error al eliminar el horario: ${error.message}`);
    }
  }, [cancelDeleteHorario, deleteDialog.scheduleId, fetchHorarios, showMessage]);

  const handleChange = useCallback((event) => {
    const { name, value, type, checked } = event.target;

    if (type === 'checkbox' && name === 'aplicar_todos_dias') {
      setFormData((prev) => ({ ...prev, aplicar_todos_dias: checked }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleDiaToggle = useCallback((diaValue) => {
    setFormData((prev) => {
      const selected = prev.dias_seleccionados.includes(diaValue);
      const nuevosDias = selected ? prev.dias_seleccionados.filter((day) => day !== diaValue) : [...prev.dias_seleccionados, diaValue];

      return {
        ...prev,
        dias_seleccionados: nuevosDias.length > 0 ? nuevosDias : [diaValue],
      };
    });
  }, []);

  const handleCategoriaToggle = useCallback((categoriaValue) => {
    setFormData((prev) => {
      const selected = prev.categorias_seleccionadas.includes(categoriaValue);
      const nuevasCategorias = selected
        ? prev.categorias_seleccionadas.filter((category) => category !== categoriaValue)
        : [...prev.categorias_seleccionadas, categoriaValue];

      return {
        ...prev,
        categorias_seleccionadas: nuevasCategorias.length > 0 ? nuevasCategorias : [categoriaValue],
      };
    });
  }, []);

  const formatTime = useCallback((time) => (time ? time.substring(0, 5) : ''), []);

  const horariosFiltrados = useMemo(() => horarios, [horarios]);

  const horariosAgrupados = useMemo(
    () =>
      horariosFiltrados.reduce((accumulator, schedule) => {
        if (!accumulator[schedule.dia_semana]) {
          accumulator[schedule.dia_semana] = [];
        }
        accumulator[schedule.dia_semana].push(schedule);
        return accumulator;
      }, {}),
    [horariosFiltrados]
  );

  return {
    horarios,
    loading,
    showForm,
    editingId,
    filterDay,
    setFilterDay,
    filterCategory,
    setFilterCategory,
    sortField,
    setSortField,
    sortDirection,
    setSortDirection,
    resetFilters,
    formData,
    message,
    deleteDialog,
    horariosFiltrados,
    horariosAgrupados,
    getDescripcionPorDefecto,
    toggleFormVisibility,
    resetForm,
    handleSubmit,
    handleEdit,
    requestDeleteHorario,
    cancelDeleteHorario,
    confirmDeleteHorario,
    handleChange,
    handleDiaToggle,
    handleCategoriaToggle,
    formatTime,
  };
};

export default useHorariosManager;

