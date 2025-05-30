<template>
    <div class="side_btn_box" :style="{ cursor: isDragging ? 'move' : 'pointer' }" id="dragElement"
         @mouseenter="showSubButtons = true" @mouseleave="showSubButtons = false">
        <el-icon>
            <Plus />
        </el-icon>
        <!-- 次级按钮 -->
        <div class="sub-btns">
            <el-button :icon="Plus" @click="handleNotes" circle class="sub-btn" />
            <el-button :icon="Tickets" @click="handleTask" circle class="sub-btn" />
            <el-button :icon="AlarmClock" @click="handleRemind" circle class="sub-btn" />
        </div>
    </div>
    <NotesEdit v-model:visible="dialogVisible" @close="closeEditor" @refreshNotes="refreshNotes" />
    <TaskEdit v-model:visible="taskDialogVisible" @close="closeTaskEditor" @refreshTaskgroups="refreshTaskgroups" />
    <RemindEdit v-model:visible="remindDialogVisible" @close="closeRemindEditor" @refreshRemind="refreshRemind" />
</template>

<script setup lang="ts">
import { ref, onMounted, defineEmits } from 'vue';
import { Plus, Tickets, AlarmClock } from '@element-plus/icons-vue';
import NotesEdit from "./NotesEdit.vue";
import TaskEdit from "./TaskEdit.vue";
import RemindEdit from "./RemindEdit.vue";

const isDragging = ref(false);
const showSubButtons = ref(false); 
const dialogVisible = ref(false);
const taskDialogVisible = ref(false);
const remindDialogVisible = ref(false);

// 定义 emit 事件
const emit = defineEmits(['update:visible', 'close', 'refreshNotes', 'refreshTaskgroups', 'refreshRemind']);

const refreshNotes = () => {
    emit('refreshNotes');
};

const refreshTaskgroups = () => {
    emit('refreshTaskgroups');
};

const refreshRemind = () => {
    emit('refreshRemind');
};

// 添加便签按钮
const handleNotes = () => {
    resetNoteData(); // 重置便签数据
    dialogVisible.value = true;
};

// 添加清单按钮
const handleTask = () => {
    resetTaskData(); // 重置清单数据
    taskDialogVisible.value = true;
};

// 添加提醒按钮
const handleRemind = () => {
    resetRemindData(); // 重置提醒数据
    remindDialogVisible.value = true;
};

const closeEditor = () => {
    dialogVisible.value = false;
};

const closeTaskEditor = () => {
    taskDialogVisible.value = false;
    refreshTaskgroups(); // 关闭编辑页后刷新任务组列表
};

const closeRemindEditor = () => {
    remindDialogVisible.value = false;
    refreshRemind(); // 关闭编辑页后刷新提醒列表
};

// 侧边栏拖拽功能
const SideBtnDrag = () => {
    const dragElement = document.getElementById('dragElement') as HTMLElement;
    let startY = 0;
    let currentY = 0;

    function handleMouseMove(event: any) {
        isDragging.value = true;
        currentY = event.clientY;
        const distance = currentY - startY;
        let currentTop = parseInt(dragElement.style.top) || dragElement.offsetTop || 0;
        const viewportHeight = window.innerHeight;

        if (currentTop <= 0) { currentTop = 0; }
        else if (currentTop + 40 > viewportHeight) { currentTop = viewportHeight - 40; }

        dragElement.style.top = currentTop + distance + 'px';
        startY = currentY;
    }

    function handleMouseUp() {
        isDragging.value = false;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    }

    dragElement.addEventListener('mousedown', (event) => {
        startY = event.clientY;
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    });
};

onMounted(() => {
    SideBtnDrag();
});

// 重置便签数据
const resetNoteData = () => {
    const notesEditComponent = document.querySelector('NotesEdit') as any;
    if (notesEditComponent && notesEditComponent.resetNoteData) {
        notesEditComponent.resetNoteData();
    }
};

// 重置清单数据
const resetTaskData = () => {
    const taskEditComponent = document.querySelector('TaskEdit') as any;
    if (taskEditComponent && taskEditComponent.resetTaskData) {
        taskEditComponent.resetTaskData();
    }
};

const resetRemindData = () => {
    const remindEditComponent = document.querySelector('RemindEdit') as any;
    if (remindEditComponent && remindEditComponent.resetRemindData) {
        remindEditComponent.resetRemindData();
    }
};
</script>

<style scoped lang="less">
.el-icon {
    color: white;
}

.side_btn_box {
    position: fixed;
    right: 0;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background-color: #409eff;
    bottom: 100px;
    z-index: 3000;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s ease;

    .sub-btns {
        display: flex;
        flex-direction: column;
        gap: 8px;
        position: absolute;
        top: -150px;
        right: 0;
        transition: opacity 0.3s ease-in-out;
        opacity: 0;
        visibility: hidden;
        align-items: flex-start;
    }

    &:hover {
        .sub-btns {
            opacity: 1;
            visibility: visible;
        }
    }
}

.sub-btns .sub-btn {
    margin: 0;
    width: 40px;
    height: 40px;
    display: flex;
    justify-content: center;
    align-items: center;
}

.sub-btns el-button {
    margin: 0;
}
</style>