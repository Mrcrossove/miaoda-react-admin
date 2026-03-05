package com.app8sm6r7tdrncx.plugins;

import android.content.ActivityNotFoundException;
import android.content.ComponentName;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.net.Uri;
import android.util.Base64;
import android.util.Log;

import androidx.core.content.FileProvider;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.util.ArrayList;

/**
 * 小红书分享插件
 * 支持单图和多图分享到小红书草稿箱
 * 
 * 关键配置：
 * 1. AndroidManifest.xml 需要添加 FileProvider 配置
 * 2. res/xml/file_paths.xml 需要配置文件共享路径
 * 3. 确保小红书应用已安装（包名：com.xingin.xhs）
 */
@CapacitorPlugin(name = "XhsShare")
public class XhsSharePlugin extends Plugin {
    
    private static final String TAG = "XhsSharePlugin";
    
    // 小红书应用包名
    private static final String XHS_PACKAGE_NAME = "com.xingin.xhs";
    
    // 小红书草稿箱Scheme
    private static final String XHS_DRAFT_SCHEME = "xiaohongshu://creator/publish";
    
    // 小红书最大图片数量限制
    private static final int MAX_IMAGE_COUNT = 9;
    
    /**
     * 检查小红书应用是否已安装
     */
    @PluginMethod
    public void isXhsInstalled(PluginCall call) {
        try {
            PackageManager pm = getContext().getPackageManager();
            pm.getPackageInfo(XHS_PACKAGE_NAME, PackageManager.GET_ACTIVITIES);
            
            JSObject ret = new JSObject();
            ret.put("installed", true);
            call.resolve(ret);
        } catch (PackageManager.NameNotFoundException e) {
            JSObject ret = new JSObject();
            ret.put("installed", false);
            call.resolve(ret);
        }
    }
    
    /**
     * 分享单张图片到小红书草稿箱
     * 
     * @param call 包含参数：
     *             - text: 文案内容
     *             - imageBase64: 图片Base64数据
     */
    @PluginMethod
    public void shareToXhs(PluginCall call) {
        String text = call.getString("text", "");
        String imageBase64 = call.getString("imageBase64");
        
        if (imageBase64 == null || imageBase64.isEmpty()) {
            call.reject("图片数据为空");
            return;
        }
        
        try {
            // 检查小红书是否已安装
            if (!isAppInstalled(XHS_PACKAGE_NAME)) {
                call.reject("未检测到小红书应用");
                return;
            }
            
            // 将Base64转换为Bitmap
            Bitmap bitmap = base64ToBitmap(imageBase64);
            if (bitmap == null) {
                call.reject("图片解码失败");
                return;
            }
            
            // 保存图片到临时文件
            File imageFile = saveBitmapToFile(bitmap, "xhs_share_image.jpg");
            if (imageFile == null) {
                call.reject("图片保存失败");
                return;
            }
            
            // 获取图片Uri（使用FileProvider）
            Uri imageUri = FileProvider.getUriForFile(
                getContext(),
                getContext().getPackageName() + ".fileprovider",
                imageFile
            );
            
            // 创建Intent唤起小红书
            Intent intent = new Intent(Intent.ACTION_SEND);
            
            // 不指定Component，让系统选择器或小红书自动处理
            intent.setPackage(XHS_PACKAGE_NAME);  // 只指定包名
            intent.setType("image/*");
            
            // 添加文案
            intent.putExtra(Intent.EXTRA_TEXT, text);
            intent.putExtra(Intent.EXTRA_SUBJECT, "分享到小红书");
            
            // 添加图片
            intent.putExtra(Intent.EXTRA_STREAM, imageUri);
            
            // 添加必要的权限标志
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            intent.addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP);
            
            // 尝试启动小红书
            try {
                getContext().startActivity(intent);
            } catch (ActivityNotFoundException e) {
                // 如果小红书不支持这个Intent，尝试使用选择器
                Log.w(TAG, "小红书不支持直接分享，尝试使用选择器");
                Intent chooser = Intent.createChooser(intent, "分享到小红书");
                chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(chooser);
            }
            
            JSObject ret = new JSObject();
            ret.put("success", true);
            ret.put("message", "已打开小红书草稿箱");
            call.resolve(ret);
            
        } catch (Exception e) {
            Log.e(TAG, "分享到小红书失败", e);
            call.reject("分享失败: " + e.getMessage());
        }
    }
    
    /**
     * 分享多张图片到小红书草稿箱
     * 多图适配：支持传递多张图片的Base64数据
     * 
     * @param call 包含参数：
     *             - text: 文案内容
     *             - images: 图片数组，每个元素包含 base64 和 filename
     */
    @PluginMethod
    public void shareMultiImagesToXhs(PluginCall call) {
        String text = call.getString("text", "");
        JSArray imagesArray = call.getArray("images");
        
        if (imagesArray == null || imagesArray.length() == 0) {
            call.reject("图片数据为空");
            return;
        }
        
        try {
            // 检查小红书是否已安装
            if (!isAppInstalled(XHS_PACKAGE_NAME)) {
                call.reject("未检测到小红书应用");
                return;
            }
            
            // 检查图片数量是否超过限制
            int imageCount = imagesArray.length();
            if (imageCount > MAX_IMAGE_COUNT) {
                Log.w(TAG, "图片数量超过限制，将截断到" + MAX_IMAGE_COUNT + "张");
                imageCount = MAX_IMAGE_COUNT;
            }
            
            // 处理多张图片
            ArrayList<Uri> imageUris = new ArrayList<>();
            ArrayList<String> failedImages = new ArrayList<>();
            int successCount = 0;
            int failedCount = 0;
            
            for (int i = 0; i < imageCount; i++) {
                try {
                    JSONObject imageObj = imagesArray.getJSONObject(i);
                    String base64 = imageObj.getString("base64");
                    String filename = imageObj.getString("filename");
                    
                    // 将Base64转换为Bitmap
                    Bitmap bitmap = base64ToBitmap(base64);
                    if (bitmap == null) {
                        Log.e(TAG, "图片解码失败: " + filename);
                        failedImages.add(filename);
                        failedCount++;
                        continue;
                    }
                    
                    // 保存图片到临时文件
                    File imageFile = saveBitmapToFile(bitmap, filename);
                    if (imageFile == null) {
                        Log.e(TAG, "图片保存失败: " + filename);
                        failedImages.add(filename);
                        failedCount++;
                        continue;
                    }
                    
                    // 获取图片Uri（使用FileProvider）
                    // 多图适配关键点：使用FileProvider共享多个文件
                    Uri imageUri = FileProvider.getUriForFile(
                        getContext(),
                        getContext().getPackageName() + ".fileprovider",
                        imageFile
                    );
                    
                    imageUris.add(imageUri);
                    successCount++;
                    
                } catch (JSONException e) {
                    Log.e(TAG, "处理图片失败: " + i, e);
                    failedCount++;
                }
            }
            
            // 检查是否有成功的图片
            if (imageUris.isEmpty()) {
                call.reject("所有图片处理失败");
                return;
            }
            
            // 创建Intent唤起小红书
            // 关键优化：不指定特定的Activity，让小红书自己决定打开哪个页面
            // 使用ACTION_SEND_MULTIPLE + 正确的MIME类型
            Intent intent = new Intent(Intent.ACTION_SEND_MULTIPLE);
            
            // 不指定Component，让系统选择器或小红书自动处理
            // 这样小红书可以根据Intent内容自动打开草稿箱并填充内容
            intent.setPackage(XHS_PACKAGE_NAME);  // 只指定包名，不指定Activity
            intent.setType("image/*");
            
            // 添加文案
            intent.putExtra(Intent.EXTRA_TEXT, text);
            intent.putExtra(Intent.EXTRA_SUBJECT, "分享到小红书");  // 添加主题
            
            // 添加图片
            intent.putParcelableArrayListExtra(Intent.EXTRA_STREAM, imageUris);
            
            // 添加必要的权限标志
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            intent.addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION);  // 添加写权限
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP);  // 清除栈顶
            
            // 尝试启动小红书
            try {
                getContext().startActivity(intent);
            } catch (ActivityNotFoundException e) {
                // 如果小红书不支持这个Intent，尝试使用选择器
                Log.w(TAG, "小红书不支持直接分享，尝试使用选择器");
                Intent chooser = Intent.createChooser(intent, "分享到小红书");
                chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(chooser);
            }
            
            // 返回结果
            JSObject ret = new JSObject();
            ret.put("success", true);
            ret.put("message", "已打开小红书草稿箱");
            ret.put("successCount", successCount);
            ret.put("failedCount", failedCount);
            
            // 返回失败的图片列表
            JSArray failedArray = new JSArray();
            for (String failedImage : failedImages) {
                failedArray.put(failedImage);
            }
            ret.put("failedImages", failedArray);
            
            call.resolve(ret);
            
        } catch (Exception e) {
            Log.e(TAG, "分享多图到小红书失败", e);
            call.reject("分享失败: " + e.getMessage());
        }
    }
    
    /**
     * 检查应用是否已安装
     */
    private boolean isAppInstalled(String packageName) {
        try {
            PackageManager pm = getContext().getPackageManager();
            pm.getPackageInfo(packageName, PackageManager.GET_ACTIVITIES);
            return true;
        } catch (PackageManager.NameNotFoundException e) {
            return false;
        }
    }
    
    /**
     * 将Base64字符串转换为Bitmap
     * 多图适配：支持批量转换
     */
    private Bitmap base64ToBitmap(String base64Str) {
        try {
            // 移除Base64前缀（如果存在）
            if (base64Str.contains(",")) {
                base64Str = base64Str.split(",")[1];
            }
            
            byte[] decodedBytes = Base64.decode(base64Str, Base64.DEFAULT);
            return BitmapFactory.decodeByteArray(decodedBytes, 0, decodedBytes.length);
        } catch (Exception e) {
            Log.e(TAG, "Base64转Bitmap失败", e);
            return null;
        }
    }
    
    /**
     * 将Bitmap保存到临时文件
     * 多图适配：每张图片保存为独立文件
     */
    private File saveBitmapToFile(Bitmap bitmap, String filename) {
        try {
            // 创建临时目录
            File cacheDir = new File(getContext().getCacheDir(), "xhs_share");
            if (!cacheDir.exists()) {
                cacheDir.mkdirs();
            }
            
            // 创建图片文件
            File imageFile = new File(cacheDir, filename);
            
            // 保存Bitmap到文件
            FileOutputStream fos = new FileOutputStream(imageFile);
            bitmap.compress(Bitmap.CompressFormat.JPEG, 90, fos);
            fos.flush();
            fos.close();
            
            return imageFile;
        } catch (IOException e) {
            Log.e(TAG, "保存图片失败", e);
            return null;
        }
    }
}
