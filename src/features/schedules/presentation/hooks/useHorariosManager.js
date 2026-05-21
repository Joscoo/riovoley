import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { trainingCategoriesService } from '../../../training-categories';
import { schedulesService } from '../../schedulesService';
import { SORT_DIRECTION, createTableQuery } from '../../../../shared/lib/tableQuery';

const INITIAL_FORM = {
  dias_seleccionados: ['lunes'],
  hora_inicio: '',
  hora_fin: '',
  categorias_seleccionadas: [],
  aplicar_todos_dias: false,
  descripcion: '',
};

const INITIAL_CATEGORY_FORM = {
  code: '',
  label: '',
  default_description: '',
  for_schedules: true,
  for_students: true,
  is_active: true,
};

const EMPTY_MESSAGE = { type: '', text: '' };

const normalizeCategoryCode = (rawCode) =>
  String(rawCode || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_');

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
  const [allCategories, setAllCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoryForm, setCategoryForm] = useState(INITIAL_CATEGORY_FORM);
  const [editingCategoryCode, setEditingCategoryCode] = useState(null);
  const [categorySubmitting, setCategorySubmitting] = useState(false);

  const availableCategories = useMemo(
    () => (allCategories || []).filter((category) => category.for_schedules && category.is_active),
    [allCategories]
  );

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
    return trainingCategoriesService.getDefaultDescription({
      categories: allCategories,
      code: categoria,
    });
  }, [allCategories]);

  const loadCategories = useCallback(async () => {
    try {
      setCategoriesLoading(true);
      const categories = await trainingCategoriesService.listCategories();
      setAllCategories(categories || []);
    } catch (error) {
      console.error('Error al cargar categorias para horarios:', error);
      showMessage('error', `No se pudieron cargar categorias: ${error.message}`);
      setAllCategories([]);
    } finally {
      setCategoriesLoading(false);
    }
  }, [showMessage]);

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

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    const allowedCodes = new Set(availableCategories.map((category) => category.code));
    setFormData((prev) => {
      const selected = prev.categorias_seleccionadas.filter((code) => allowedCodes.has(code));
      if (selected.length === 0 && availableCategories.length > 0) {
        selected.push(availableCategories[0].code);
      }

      const changed = selected.length !== prev.categorias_seleccionadas.length
        || selected.some((code, index) => code !== prev.categorias_seleccionadas[index]);

      if (!changed) return prev;
      return { ...prev, categorias_seleccionadas: selected };
    });
  }, [availableCategories]);

  const resetForm = useCallback(() => {
    setFormData({
      ...INITIAL_FORM,
      categorias_seleccionadas: availableCategories.length > 0 ? [availableCategories[0].code] : [],
    });
    setEditingId(null);
    setShowForm(false);
  }, [availableCategories]);

  const toggleFormVisibility = useCallback(() => {
    if (showForm) {
      resetForm();
      return;
    }
    setEditingId(null);
    setFormData({
      ...INITIAL_FORM,
      categorias_seleccionadas: availableCategories.length > 0 ? [availableCategories[0].code] : [],
    });
    setShowForm(true);
  }, [availableCategories, resetForm, showForm]);

  const resetCategoryForm = useCallback(() => {
    setCategoryForm(INITIAL_CATEGORY_FORM);
    setEditingCategoryCode(null);
  }, []);

  const handleCategoryFormChange = useCallback((event) => {
    const { name, value, type, checked } = event.target;
    setCategoryForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  }, []);

  const handleCategoryEdit = useCallback((category) => {
    if (!category) return;
    setEditingCategoryCode(category.code);
    setCategoryForm({
      code: category.code || '',
      label: category.label || '',
      default_description: category.default_description || '',
      for_schedules: Boolean(category.for_schedules),
      for_students: Boolean(category.for_students),
      is_active: Boolean(category.is_active),
    });
  }, []);

  const validateCategoryForm = useCallback(() => {
    const normalizedCode = normalizeCategoryCode(categoryForm.code);
    if (!normalizedCode) {
      return 'El codigo de categoria es requerido.';
    }
    if (!/^[a-z0-9_]+$/.test(normalizedCode)) {
      return 'El codigo solo puede contener letras minúsculas, numeros y guion bajo.';
    }
    if (!categoryForm.label?.trim()) {
      return 'La etiqueta (label) es requerida.';
    }
    if (!categoryForm.for_schedules && !categoryForm.for_students) {
      return 'La categoria debe aplicar al menos a horarios o atletas.';
    }
    return null;
  }, [categoryForm]);

  const handleCategorySubmit = useCallback(async (event) => {
    event.preventDefault();
    const validationError = validateCategoryForm();
    if (validationError) {
      showMessage('error', validationError);
      return;
    }

    const normalizedCode = normalizeCategoryCode(categoryForm.code);
    const payload = {
      label: categoryForm.label.trim(),
      default_description: categoryForm.default_description?.trim() || null,
      for_schedules: Boolean(categoryForm.for_schedules),
      for_students: Boolean(categoryForm.for_students),
      is_active: Boolean(categoryForm.is_active),
    };

    try {
      setCategorySubmitting(true);
      if (editingCategoryCode) {
        await trainingCategoriesService.updateCategory(editingCategoryCode, payload);
        showMessage('success', `Categoria ${editingCategoryCode} actualizada.`);
      } else {
        await trainingCategoriesService.createCategory({
          code: normalizedCode,
          ...payload,
        });
        showMessage('success', `Categoria ${normalizedCode} creada.`);
      }

      resetCategoryForm();
      await loadCategories();
    } catch (error) {
      console.error('Error gestionando categoria:', error);
      showMessage('error', `No se pudo guardar la categoria: ${error.message}`);
    } finally {
      setCategorySubmitting(false);
    }
  }, [categoryForm, editingCategoryCode, loadCategories, resetCategoryForm, showMessage, validateCategoryForm]);

  const handleToggleCategoryActive = useCallback(async (category) => {
    if (!category?.code) return;
    try {
      setCategorySubmitting(true);
      await trainingCategoriesService.toggleCategoryActive({
        code: category.code,
        is_active: !category.is_active,
      });
      showMessage('success', `Categoria ${category.code} ${category.is_active ? 'desactivada' : 'activada'}.`);
      await loadCategories();
    } catch (error) {
      console.error('Error activando/desactivando categoria:', error);
      showMessage('error', `No se pudo actualizar la categoria: ${error.message}`);
    } finally {
      setCategorySubmitting(false);
    }
  }, [loadCategories, showMessage]);

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
    allCategories,
    availableCategories,
    categoriesLoading,
    categoryForm,
    editingCategoryCode,
    categorySubmitting,
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
    handleCategoryFormChange,
    handleCategorySubmit,
    handleCategoryEdit,
    handleToggleCategoryActive,
    resetCategoryForm,
  };
};

export default useHorariosManager;

