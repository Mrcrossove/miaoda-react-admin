package com.app8sm6r7tdrncx.services;

import android.accessibilityservice.AccessibilityService;
import android.accessibilityservice.GestureDescription;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.content.Intent;
import android.graphics.Path;
import android.graphics.Rect;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.view.accessibility.AccessibilityEvent;
import android.view.accessibility.AccessibilityNodeInfo;

import java.util.ArrayList;
import java.util.List;

/**
 * 小红书自动发布无障碍服务
 * 用于自动化操作小红书APP，实现自动上传图片和填写文案
 * 
 * 功能：
 * 1. 监听小红书APP打开
 * 2. 自动点击"+"发布按钮
 * 3. 自动选择图片
 * 4. 自动填写文案
 * 5. 等待用户点击"发布"
 * 
 * 注意：
 * - 需要用户在系统设置中授予无障碍权限
 * - 需要适配不同版本的小红书APP
 * - 可能违反小红书服务条款，使用需谨慎
 */
public class XhsAutoPublishService extends AccessibilityService {
    
    private static final String TAG = "XhsAutoPublishService";
    private static final String XHS_PACKAGE_NAME = "com.xingin.xhs";
    
    // 自动化任务状态
    private static boolean isTaskRunning = false;
    private static List<String> imagePaths = new ArrayList<>();
    private static String captionText = "";
    
    // 当前步骤
    private enum Step {
        IDLE,                    // 空闲
        WAITING_FOR_XHS,        // 等待小红书打开
        CLICK_PUBLISH_BUTTON,   // 点击发布按钮
        SELECT_IMAGES,          // 选择图片
        CLICK_NEXT,             // 点击下一步
        FILL_CAPTION,           // 填写文案
        DONE                    // 完成
    }
    
    private Step currentStep = Step.IDLE;
    private Handler handler = new Handler(Looper.getMainLooper());
    
    /**
     * 启动自动发布任务
     * 从外部调用此方法开始自动化流程
     */
    public static void startAutoPublish(List<String> images, String caption) {
        imagePaths = new ArrayList<>(images);
        captionText = caption;
        isTaskRunning = true;
        Log.i(TAG, "自动发布任务已启动，图片数量：" + images.size());
    }
    
    /**
     * 停止自动发布任务
     */
    public static void stopAutoPublish() {
        isTaskRunning = false;
        imagePaths.clear();
        captionText = "";
        Log.i(TAG, "自动发布任务已停止");
    }
    
    /**
     * 检查任务是否正在运行
     */
    public static boolean isTaskRunning() {
        return isTaskRunning;
    }
    
    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {
        if (!isTaskRunning) {
            return;
        }
        
        // 获取当前包名
        String packageName = event.getPackageName() != null ? event.getPackageName().toString() : "";
        
        // 只处理小红书APP的事件
        if (!XHS_PACKAGE_NAME.equals(packageName)) {
            return;
        }
        
        int eventType = event.getEventType();
        Log.d(TAG, "收到事件：" + AccessibilityEvent.eventTypeToString(eventType) + "，当前步骤：" + currentStep);
        
        // 根据当前步骤执行相应操作
        switch (currentStep) {
            case IDLE:
                // 检测到小红书打开，开始自动化流程
                if (eventType == AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) {
                    currentStep = Step.WAITING_FOR_XHS;
                    handler.postDelayed(() -> clickPublishButton(), 1000);
                }
                break;
                
            case WAITING_FOR_XHS:
                // 等待小红书完全加载
                break;
                
            case CLICK_PUBLISH_BUTTON:
                // 点击发布按钮后，等待图片选择页面
                if (eventType == AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED) {
                    handler.postDelayed(() -> selectImages(), 1000);
                }
                break;
                
            case SELECT_IMAGES:
                // 选择图片后，等待下一步按钮
                break;
                
            case CLICK_NEXT:
                // 点击下一步后，等待文案输入页面
                if (eventType == AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED) {
                    handler.postDelayed(() -> fillCaption(), 1000);
                }
                break;
                
            case FILL_CAPTION:
                // 填写文案后，任务完成
                break;
                
            case DONE:
                // 任务完成，停止监听
                stopAutoPublish();
                currentStep = Step.IDLE;
                break;
        }
    }
    
    /**
     * 点击小红书的"+"发布按钮
     */
    private void clickPublishButton() {
        Log.i(TAG, "开始查找发布按钮");
        AccessibilityNodeInfo rootNode = getRootInActiveWindow();
        if (rootNode == null) {
            Log.e(TAG, "无法获取根节点");
            return;
        }
        
        // 查找发布按钮（通常是一个"+"图标或"发布"文字）
        List<AccessibilityNodeInfo> publishButtons = new ArrayList<>();
        
        // 方法1：通过文本查找
        publishButtons.addAll(rootNode.findAccessibilityNodeInfosByText("发布"));
        publishButtons.addAll(rootNode.findAccessibilityNodeInfosByText("+"));
        
        // 方法2：通过ViewId查找（需要根据实际小红书APP的布局调整）
        // publishButtons.addAll(rootNode.findAccessibilityNodeInfosByViewId("com.xingin.xhs:id/publish_button"));
        
        if (!publishButtons.isEmpty()) {
            AccessibilityNodeInfo button = publishButtons.get(0);
            if (button.isClickable()) {
                button.performAction(AccessibilityNodeInfo.ACTION_CLICK);
                Log.i(TAG, "已点击发布按钮");
                currentStep = Step.CLICK_PUBLISH_BUTTON;
            } else {
                // 如果按钮本身不可点击，尝试点击父节点
                AccessibilityNodeInfo parent = button.getParent();
                if (parent != null && parent.isClickable()) {
                    parent.performAction(AccessibilityNodeInfo.ACTION_CLICK);
                    Log.i(TAG, "已点击发布按钮（父节点）");
                    currentStep = Step.CLICK_PUBLISH_BUTTON;
                }
            }
        } else {
            Log.w(TAG, "未找到发布按钮，1秒后重试");
            handler.postDelayed(() -> clickPublishButton(), 1000);
        }
        
        rootNode.recycle();
    }
    
    /**
     * 选择图片
     */
    private void selectImages() {
        Log.i(TAG, "开始选择图片");
        AccessibilityNodeInfo rootNode = getRootInActiveWindow();
        if (rootNode == null) {
            Log.e(TAG, "无法获取根节点");
            return;
        }
        
        // 查找图片网格或列表
        // 注意：这里需要根据实际小红书APP的布局进行调整
        // 通常图片会在RecyclerView或GridView中
        
        // 方法1：查找"相册"或"图片"文字，点击进入相册
        List<AccessibilityNodeInfo> albumButtons = new ArrayList<>();
        albumButtons.addAll(rootNode.findAccessibilityNodeInfosByText("相册"));
        albumButtons.addAll(rootNode.findAccessibilityNodeInfosByText("图片"));
        
        if (!albumButtons.isEmpty()) {
            AccessibilityNodeInfo button = albumButtons.get(0);
            performClick(button);
            Log.i(TAG, "已点击相册按钮");
            
            // 等待相册加载后选择图片
            handler.postDelayed(() -> selectImagesFromAlbum(), 1500);
        } else {
            Log.w(TAG, "未找到相册按钮，1秒后重试");
            handler.postDelayed(() -> selectImages(), 1000);
        }
        
        rootNode.recycle();
    }
    
    /**
     * 从相册中选择图片
     */
    private void selectImagesFromAlbum() {
        Log.i(TAG, "开始从相册选择图片");
        AccessibilityNodeInfo rootNode = getRootInActiveWindow();
        if (rootNode == null) {
            Log.e(TAG, "无法获取根节点");
            return;
        }
        
        // 查找图片缩略图（通常是ImageView）
        // 选择前N张图片（根据imagePaths的数量）
        List<AccessibilityNodeInfo> imageNodes = findImageNodes(rootNode);
        
        int selectCount = Math.min(imagePaths.size(), imageNodes.size());
        for (int i = 0; i < selectCount; i++) {
            AccessibilityNodeInfo imageNode = imageNodes.get(i);
            performClick(imageNode);
            Log.i(TAG, "已选择第" + (i + 1) + "张图片");
        }
        
        // 选择完成后，点击"下一步"或"完成"按钮
        handler.postDelayed(() -> clickNextButton(), 1000);
        
        rootNode.recycle();
    }
    
    /**
     * 查找图片节点
     */
    private List<AccessibilityNodeInfo> findImageNodes(AccessibilityNodeInfo rootNode) {
        List<AccessibilityNodeInfo> imageNodes = new ArrayList<>();
        
        // 递归查找所有ImageView
        findImageNodesRecursive(rootNode, imageNodes);
        
        return imageNodes;
    }
    
    /**
     * 递归查找图片节点
     */
    private void findImageNodesRecursive(AccessibilityNodeInfo node, List<AccessibilityNodeInfo> result) {
        if (node == null) {
            return;
        }
        
        // 检查是否是ImageView
        String className = node.getClassName() != null ? node.getClassName().toString() : "";
        if (className.contains("ImageView") && node.isClickable()) {
            result.add(node);
        }
        
        // 递归查找子节点
        int childCount = node.getChildCount();
        for (int i = 0; i < childCount; i++) {
            AccessibilityNodeInfo child = node.getChild(i);
            if (child != null) {
                findImageNodesRecursive(child, result);
            }
        }
    }
    
    /**
     * 点击"下一步"按钮
     */
    private void clickNextButton() {
        Log.i(TAG, "开始查找下一步按钮");
        AccessibilityNodeInfo rootNode = getRootInActiveWindow();
        if (rootNode == null) {
            Log.e(TAG, "无法获取根节点");
            return;
        }
        
        // 查找"下一步"或"完成"按钮
        List<AccessibilityNodeInfo> nextButtons = new ArrayList<>();
        nextButtons.addAll(rootNode.findAccessibilityNodeInfosByText("下一步"));
        nextButtons.addAll(rootNode.findAccessibilityNodeInfosByText("完成"));
        nextButtons.addAll(rootNode.findAccessibilityNodeInfosByText("Next"));
        
        if (!nextButtons.isEmpty()) {
            AccessibilityNodeInfo button = nextButtons.get(0);
            performClick(button);
            Log.i(TAG, "已点击下一步按钮");
            currentStep = Step.CLICK_NEXT;
        } else {
            Log.w(TAG, "未找到下一步按钮，1秒后重试");
            handler.postDelayed(() -> clickNextButton(), 1000);
        }
        
        rootNode.recycle();
    }
    
    /**
     * 填写文案
     */
    private void fillCaption() {
        Log.i(TAG, "开始填写文案");
        AccessibilityNodeInfo rootNode = getRootInActiveWindow();
        if (rootNode == null) {
            Log.e(TAG, "无法获取根节点");
            return;
        }
        
        // 查找文案输入框（通常是EditText）
        List<AccessibilityNodeInfo> editTexts = findEditTextNodes(rootNode);
        
        if (!editTexts.isEmpty()) {
            AccessibilityNodeInfo editText = editTexts.get(0);
            
            // 方法1：直接设置文本（推荐）
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                // 先聚焦输入框
                editText.performAction(AccessibilityNodeInfo.ACTION_FOCUS);
                
                // 设置文本
                android.os.Bundle arguments = new android.os.Bundle();
                arguments.putCharSequence(AccessibilityNodeInfo.ACTION_ARGUMENT_SET_TEXT_CHARSEQUENCE, captionText);
                editText.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, arguments);
                
                Log.i(TAG, "已填写文案：" + captionText);
            } else {
                // 方法2：使用剪贴板粘贴（兼容旧版本）
                copyToClipboard(captionText);
                editText.performAction(AccessibilityNodeInfo.ACTION_FOCUS);
                editText.performAction(AccessibilityNodeInfo.ACTION_PASTE);
                
                Log.i(TAG, "已通过剪贴板填写文案");
            }
            
            currentStep = Step.DONE;
            Log.i(TAG, "自动化流程完成，等待用户点击发布按钮");
        } else {
            Log.w(TAG, "未找到文案输入框，1秒后重试");
            handler.postDelayed(() -> fillCaption(), 1000);
        }
        
        rootNode.recycle();
    }
    
    /**
     * 查找EditText节点
     */
    private List<AccessibilityNodeInfo> findEditTextNodes(AccessibilityNodeInfo rootNode) {
        List<AccessibilityNodeInfo> editTexts = new ArrayList<>();
        findEditTextNodesRecursive(rootNode, editTexts);
        return editTexts;
    }
    
    /**
     * 递归查找EditText节点
     */
    private void findEditTextNodesRecursive(AccessibilityNodeInfo node, List<AccessibilityNodeInfo> result) {
        if (node == null) {
            return;
        }
        
        String className = node.getClassName() != null ? node.getClassName().toString() : "";
        if (className.contains("EditText")) {
            result.add(node);
        }
        
        int childCount = node.getChildCount();
        for (int i = 0; i < childCount; i++) {
            AccessibilityNodeInfo child = node.getChild(i);
            if (child != null) {
                findEditTextNodesRecursive(child, result);
            }
        }
    }
    
    /**
     * 执行点击操作
     */
    private void performClick(AccessibilityNodeInfo node) {
        if (node == null) {
            return;
        }
        
        if (node.isClickable()) {
            node.performAction(AccessibilityNodeInfo.ACTION_CLICK);
        } else {
            // 如果节点本身不可点击，尝试点击父节点
            AccessibilityNodeInfo parent = node.getParent();
            if (parent != null) {
                performClick(parent);
            }
        }
    }
    
    /**
     * 复制文本到剪贴板
     */
    private void copyToClipboard(String text) {
        ClipboardManager clipboard = (ClipboardManager) getSystemService(Context.CLIPBOARD_SERVICE);
        ClipData clip = ClipData.newPlainText("caption", text);
        clipboard.setPrimaryClip(clip);
    }
    
    @Override
    public void onInterrupt() {
        Log.i(TAG, "无障碍服务被中断");
        stopAutoPublish();
    }
    
    @Override
    protected void onServiceConnected() {
        super.onServiceConnected();
        Log.i(TAG, "无障碍服务已连接");
    }
    
    @Override
    public boolean onUnbind(Intent intent) {
        Log.i(TAG, "无障碍服务已解绑");
        stopAutoPublish();
        return super.onUnbind(intent);
    }
}
