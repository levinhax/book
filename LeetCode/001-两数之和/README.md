# 1.两数之和

## 题目描述

<!-- 题目描述 -->

<p>给定一个整数数组 <code>nums</code> 和一个整数目标值 <code>target</code>，请你在该数组中找出 <strong>和为目标值</strong> 的那 <strong>两个</strong> 整数，并返回它们的数组下标。</p>

<p>你可以假设每种输入只会对应一个答案。但是，数组中同一个元素在答案里不能重复出现。</p>

<p>你可以按任意顺序返回答案。</p>

<p> </p>

<p><strong>示例 1：</strong></p>

<pre>
<strong>输入：</strong>nums = [2,7,11,15], target = 9
<strong>输出：</strong>[0,1]
<strong>解释：</strong>因为 nums[0] + nums[1] == 9 ，返回 [0, 1] 。
</pre>

<p><strong>示例 2：</strong></p>

<pre>
<strong>输入：</strong>nums = [3,2,4], target = 6
<strong>输出：</strong>[1,2]
</pre>

<p><strong>示例 3：</strong></p>

<pre>
<strong>输入：</strong>nums = [3,3], target = 6
<strong>输出：</strong>[0,1]
</pre>

<p> </p>

<p><strong>提示：</strong></p>

<ul>
	<li><code>2 <= nums.length <= 10<sup>3</sup></code></li>
	<li><code>-10<sup>9</sup> <= nums[i] <= 10<sup>9</sup></code></li>
	<li><code>-10<sup>9</sup> <= target <= 10<sup>9</sup></code></li>
	<li><strong>只会存在一个有效答案</strong></li>
</ul>

## 解法

<!-- 实现逻辑 -->

### 暴力解法

```js
function twoSum (nums, target) {
    console.time("测试fn速度");
    const len = nums.length;
    let result = [];
    for (let i = 0; i < len - 1; i++) {
        for (let j = i + 1; j < len; j++) {
            if (nums[i] + nums[j] === target) {
                result = [i, j];
            }
        }
    }
    console.timeEnd("测试fn速度");
    return result;
}
```
时间复杂度为 n^2

### 哈希表

我们遍历到数字 a 时，用 target 减去 a，就会得到 b，若 b 存在于哈希表中，我们就可以直接返回结果了。若 b 不存在，那么我们将 a 存入哈希表，后续遍历时使用。

```js
const twoSum = function (nums, target) {
    console.time("测试fn速度");
    const map = new Map();
    for (let i = 0; i < nums.length; i++) {
        if (map.has(target - nums[i])) {
            console.timeEnd("测试fn速度");
            return [map.get(target - nums[i]), i];
        }
        map.set(nums[i], i);
    }
    return [];
};
```
