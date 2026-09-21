/**
 * 与 @bikariya/modals 的 runtime/types 保持一致的类型定义。
 *
 * 该包 exports 未暴露 runtime/types 子路径，其 `#modals` 虚拟别名在
 * 真实 npm 消费项目中无法被 Vue SFC 编译器稳定解析，因此 Theme 内联维护。
 */
export interface ModalProps {
	/** 过渡动画时长 (ms) @default 400 */
	duration?: number
	/** 模态框开关状态 @internal */
	open?: boolean
}

export interface ModalEmits {
	close: []
}
