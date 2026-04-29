import { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  TextInput,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Sharing from "expo-sharing";
import { useFocusEffect } from "expo-router";
import {
  getHistory,
  deleteHistoryItem,
  clearHistory,
  HistoryItem,
} from "../../utils/history";
import {
  FileText,
  Trash2,
  Share2,
  Search,
  Star,
  Pin,
  CheckCircle2,
  SlidersHorizontal,
} from "lucide-react-native";

type SortMode = "recent" | "name" | "size";
type ExtraMeta = {
  favorite?: boolean;
  pinned?: boolean;
  lastOpened?: string;
};

const META_KEY = "PDF_HISTORY_META";

export default function HistoryScreen() {
  const [data, setData] = useState<HistoryItem[]>([]);
  const [meta, setMeta] = useState<Record<string, ExtraMeta>>({});
  const [search, setSearch] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("recent");
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  async function load() {
    const items = await getHistory();
    const savedMeta = await AsyncStorage.getItem(META_KEY);

    setData(items);
    setMeta(savedMeta ? JSON.parse(savedMeta) : {});
  }

  async function saveMeta(nextMeta: Record<string, ExtraMeta>) {
    setMeta(nextMeta);
    await AsyncStorage.setItem(META_KEY, JSON.stringify(nextMeta));
  }

  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  function formatSize(size?: number | null) {
    if (!size) return "Tamanho desconhecido";

    const mb = size / 1024 / 1024;

    if (mb >= 1) return `${mb.toFixed(1)} MB`;

    return `${(size / 1024).toFixed(0)} KB`;
  }

  function isDuplicate(item: HistoryItem) {
    return (
      data.filter(
        (pdf) =>
          pdf.id !== item.id &&
          pdf.name === item.name &&
          pdf.size === item.size
      ).length > 0
    );
  }

  function getGroupTitle(date: string) {
    const itemDate = new Date(date);
    const today = new Date();

    const startToday = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

    const startItem = new Date(
      itemDate.getFullYear(),
      itemDate.getMonth(),
      itemDate.getDate()
    );

    const diff = Math.floor(
      (startToday.getTime() - startItem.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diff === 0) return "Hoje";
    if (diff === 1) return "Ontem";
    if (diff <= 7) return "Esta semana";

    return "Mais antigos";
  }

  const filteredData = useMemo(() => {
    let result = data.filter((item) =>
      item.name.toLowerCase().includes(search.toLowerCase())
    );

    result = result.sort((a, b) => {
      const metaA = meta[a.id];
      const metaB = meta[b.id];

      if (metaA?.pinned && !metaB?.pinned) return -1;
      if (!metaA?.pinned && metaB?.pinned) return 1;

      if (sortMode === "name") {
        return a.name.localeCompare(b.name);
      }

      if (sortMode === "size") {
        return (b.size || 0) - (a.size || 0);
      }

      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    const grouped: Array<
      | { type: "header"; id: string; title: string }
      | { type: "item"; id: string; item: HistoryItem }
    > = [];

    let lastGroup = "";

    result.forEach((item) => {
      const group = getGroupTitle(item.date);

      if (group !== lastGroup) {
        grouped.push({
          type: "header",
          id: `header-${group}`,
          title: group,
        });

        lastGroup = group;
      }

      grouped.push({
        type: "item",
        id: item.id,
        item,
      });
    });

    return grouped;
  }, [data, search, sortMode, meta]);

  async function preview(item: HistoryItem) {
    if (selectionMode) {
      toggleSelect(item.id);
      return;
    }

    const nextMeta = {
      ...meta,
      [item.id]: {
        ...meta[item.id],
        lastOpened: new Date().toISOString(),
      },
    };

    await saveMeta(nextMeta);

    const available = await Sharing.isAvailableAsync();

    if (!available) {
      Alert.alert("Indisponível", "Não foi possível abrir este arquivo.");
      return;
    }

    await Sharing.shareAsync(item.uri, {
      mimeType: "application/pdf",
      dialogTitle: "Abrir PDF",
      UTI: "com.adobe.pdf",
    });
  }

  async function share(uri: string) {
    const available = await Sharing.isAvailableAsync();

    if (!available) {
      Alert.alert("Indisponível", "Não foi possível compartilhar este arquivo.");
      return;
    }

    await Sharing.shareAsync(uri, {
      mimeType: "application/pdf",
      dialogTitle: "Compartilhar PDF",
      UTI: "com.adobe.pdf",
    });
  }

  async function shareSelected() {
    const selectedItems = data.filter((item) => selectedIds.includes(item.id));

    if (selectedItems.length === 0) return;

    for (const item of selectedItems) {
      await share(item.uri);
    }
  }

  async function remove(id: string) {
    await deleteHistoryItem(id);

    const nextMeta = { ...meta };
    delete nextMeta[id];

    await saveMeta(nextMeta);
    load();
  }

  async function removeSelected() {
    for (const id of selectedIds) {
      await deleteHistoryItem(id);
    }

    const nextMeta = { ...meta };

    selectedIds.forEach((id) => {
      delete nextMeta[id];
    });

    await saveMeta(nextMeta);

    setSelectedIds([]);
    setSelectionMode(false);
    load();
  }

  function confirmDelete(id: string) {
    Alert.alert("Remover arquivo", "Deseja excluir este item?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Excluir", style: "destructive", onPress: () => remove(id) },
    ]);
  }

  function confirmDeleteSelected() {
    Alert.alert(
      "Excluir selecionados",
      `Deseja excluir ${selectedIds.length} arquivo(s)?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: removeSelected,
        },
      ]
    );
  }

  function confirmClear() {
    Alert.alert("Limpar histórico", "Escolha uma opção:", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Limpar tudo",
        style: "destructive",
        onPress: async () => {
          await clearHistory();
          await saveMeta({});
          load();
        },
      },
      {
        text: "Remover duplicados",
        onPress: removeDuplicates,
      },
      {
        text: "Remover antigos (+30 dias)",
        onPress: removeOldItems,
      },
    ]);
  }

  async function removeDuplicates() {
    const seen = new Set<string>();

    for (const item of data) {
      const key = `${item.name}-${item.size || 0}`;

      if (seen.has(key)) {
        await deleteHistoryItem(item.id);
      } else {
        seen.add(key);
      }
    }

    load();
  }

  async function removeOldItems() {
    const now = new Date();

    for (const item of data) {
      const itemDate = new Date(item.date);
      const diffDays = Math.floor(
        (now.getTime() - itemDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diffDays > 30 && !meta[item.id]?.favorite && !meta[item.id]?.pinned) {
        await deleteHistoryItem(item.id);
      }
    }

    load();
  }

  function toggleSelect(id: string) {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((itemId) => itemId !== id)
        : [...current, id]
    );
  }

  function toggleFavorite(id: string) {
    const nextMeta = {
      ...meta,
      [id]: {
        ...meta[id],
        favorite: !meta[id]?.favorite,
      },
    };

    saveMeta(nextMeta);
  }

  function togglePinned(id: string) {
    const nextMeta = {
      ...meta,
      [id]: {
        ...meta[id],
        pinned: !meta[id]?.pinned,
      },
    };

    saveMeta(nextMeta);
  }

  function cycleSortMode() {
    if (sortMode === "recent") setSortMode("name");
    else if (sortMode === "name") setSortMode("size");
    else setSortMode("recent");
  }

  function getSortLabel() {
    if (sortMode === "recent") return "Recentes";
    if (sortMode === "name") return "Nome";
    return "Tamanho";
  }

  function toggleSelectionMode() {
    setSelectionMode((current) => !current);
    setSelectedIds([]);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Histórico</Text>
          <Text style={styles.subtitle}>
            Busque, organize e compartilhe seus PDFs
          </Text>
        </View>

        {data.length > 0 && (
          <TouchableOpacity onPress={confirmClear}>
            <Text style={styles.clear}>Limpar</Text>
          </TouchableOpacity>
        )}
      </View>

      {data.length > 0 && (
        <>
          <View style={styles.searchBox}>
            <Search size={18} color="#6B7280" />

            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Buscar PDF..."
              placeholderTextColor="#9CA3AF"
              style={styles.searchInput}
            />
          </View>

          <View style={styles.toolbar}>
            <TouchableOpacity style={styles.toolbarBtn} onPress={cycleSortMode}>
              <SlidersHorizontal size={16} color="#007AFF" />
              <Text style={styles.toolbarText}>{getSortLabel()}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.toolbarBtn,
                selectionMode && styles.toolbarBtnActive,
              ]}
              onPress={toggleSelectionMode}
            >
              <CheckCircle2
                size={16}
                color={selectionMode ? "#FFF" : "#007AFF"}
              />
              <Text
                style={[
                  styles.toolbarText,
                  selectionMode && styles.toolbarTextActive,
                ]}
              >
                Selecionar
              </Text>
            </TouchableOpacity>
          </View>

          {selectionMode && (
            <View style={styles.selectionBar}>
              <Text style={styles.selectionText}>
                {selectedIds.length} selecionado(s)
              </Text>

              <View style={styles.selectionActions}>
                <TouchableOpacity
                  disabled={selectedIds.length === 0}
                  onPress={shareSelected}
                >
                  <Text
                    style={[
                      styles.selectionAction,
                      selectedIds.length === 0 && styles.disabled,
                    ]}
                  >
                    Compartilhar
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  disabled={selectedIds.length === 0}
                  onPress={confirmDeleteSelected}
                >
                  <Text
                    style={[
                      styles.selectionDelete,
                      selectedIds.length === 0 && styles.disabled,
                    ]}
                  >
                    Excluir
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </>
      )}

      <FlatList
        data={filteredData}
        keyExtractor={(item) => item.id}
        contentContainerStyle={data.length === 0 && styles.emptyContainer}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <View style={styles.emptyIcon}>
              <FileText size={28} color="#007AFF" />
            </View>

            <Text style={styles.empty}>Nenhum arquivo ainda</Text>
            <Text style={styles.emptySub}>Seus PDFs aparecerão aqui</Text>
          </View>
        }
        renderItem={({ item }) => {
          if (item.type === "header") {
            return <Text style={styles.groupTitle}>{item.title}</Text>;
          }

          const pdf = item.item;
          const itemMeta = meta[pdf.id];
          const selected = selectedIds.includes(pdf.id);
          const duplicated = isDuplicate(pdf);

          return (
            <TouchableOpacity
              style={[styles.card, selected && styles.cardSelected]}
              activeOpacity={0.75}
              onPress={() => preview(pdf)}
              onLongPress={() => {
                setSelectionMode(true);
                toggleSelect(pdf.id);
              }}
            >
              {selectionMode && (
                <View style={styles.selectBox}>
                  {selected && <CheckCircle2 size={22} color="#007AFF" />}
                </View>
              )}

              <View style={styles.iconBox}>
                <FileText size={22} color="#007AFF" />
              </View>

              <View style={styles.info}>
                <View style={styles.nameRow}>
                  <Text style={styles.name} numberOfLines={1}>
                    {pdf.name}
                  </Text>
                </View>

                <Text style={styles.date}>
                  {new Date(pdf.date).toLocaleString()}
                </Text>

                <Text style={styles.metaText}>
                  {formatSize(pdf.size)}
                  {duplicated ? " • Possível duplicado" : ""}
                  {itemMeta?.lastOpened ? " • Já aberto" : ""}
                </Text>
              </View>

              {!selectionMode && (
                <>
                  <TouchableOpacity
                    onPress={() => togglePinned(pdf.id)}
                    style={styles.actionBtn}
                  >
                    <Pin
                      size={18}
                      color={itemMeta?.pinned ? "#007AFF" : "#9CA3AF"}
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => toggleFavorite(pdf.id)}
                    style={styles.actionBtn}
                  >
                    <Star
                      size={18}
                      color={itemMeta?.favorite ? "#F59E0B" : "#9CA3AF"}
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => share(pdf.uri)}
                    style={styles.actionBtn}
                  >
                    <Share2 size={18} color="#007AFF" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => confirmDelete(pdf.id)}
                    style={styles.actionBtn}
                  >
                    <Trash2 size={18} color="#FF3B30" />
                  </TouchableOpacity>
                </>
              )}
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 18,
    backgroundColor: "#F7F7F8",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },

  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#111827",
  },

  subtitle: {
    marginTop: 4,
    fontSize: 13,
    color: "#6B7280",
  },

  clear: {
    color: "#FF3B30",
    fontWeight: "700",
    fontSize: 15,
    marginTop: 8,
  },

  searchBox: {
    height: 46,
    borderRadius: 16,
    backgroundColor: "#FFF",
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    color: "#111827",
  },

  toolbar: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },

  toolbarBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 12,
    backgroundColor: "#E8F2FF",
    borderRadius: 14,
  },

  toolbarBtnActive: {
    backgroundColor: "#007AFF",
  },

  toolbarText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#007AFF",
  },

  toolbarTextActive: {
    color: "#FFF",
  },

  selectionBar: {
    backgroundColor: "#111827",
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  selectionText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 13,
  },

  selectionActions: {
    flexDirection: "row",
    gap: 14,
  },

  selectionAction: {
    color: "#60A5FA",
    fontWeight: "800",
    fontSize: 13,
  },

  selectionDelete: {
    color: "#F87171",
    fontWeight: "800",
    fontSize: 13,
  },

  disabled: {
    opacity: 0.4,
  },

  emptyContainer: {
    flexGrow: 1,
    justifyContent: "center",
  },

  emptyBox: {
    alignItems: "center",
    marginTop: -80,
  },

  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: "#E8F2FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },

  empty: {
    fontSize: 17,
    color: "#111827",
    fontWeight: "700",
  },

  emptySub: {
    fontSize: 13,
    color: "#9CA3AF",
    marginTop: 4,
  },

  groupTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#6B7280",
    marginTop: 8,
    marginBottom: 8,
  },

  card: {
    backgroundColor: "#FFF",
    padding: 14,
    borderRadius: 20,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
  },

  cardSelected: {
    borderWidth: 2,
    borderColor: "#007AFF",
    backgroundColor: "#F0F7FF",
  },

  selectBox: {
    width: 26,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 4,
  },

  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#E8F2FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  info: {
    flex: 1,
  },

  nameRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  name: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },

  date: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
  },

  metaText: {
    fontSize: 11,
    color: "#9CA3AF",
    marginTop: 3,
  },

  actionBtn: {
    padding: 7,
    marginLeft: 2,
  },
});