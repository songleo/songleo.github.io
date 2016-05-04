---
layout: post
title: 关于算法复杂度
date: 2016-01-17 22:04:31
---

本文主要通过介绍如何计算十进制数转换成二进制数后，其二进制数中是1的个数,进而分析算法复杂度相关问题。例如十进制数7,二进制表示为0111,总共有三个1。

代码使用go语言实现，为简单起见，算法4和算法5只能计算0-255范围之内的数。

## 算法1

算法复杂度是O(N),其中N是十进制数字的二进制表示位数。
比如：十进制16，二进制表示为：1 0000
计算出16二进制数中1的个数需运算5次。

```go
func divideCount(number int) int {
	counter := 0
	for counter = 0; number != 0; number /= 2 {
		if number%2 == 1 {
			counter++
		}
	}
	return counter
}
```

## 算法2

算法复杂度是O(N),其中N是十进制数字的二进制表示位数。
比如：十进制16，二进制表示为：1 0000
计算出16二进制数中1的个数需运算5次。

```go
func shiftCount(number int) int {
	counter := 0
	for counter = 0; number != 0; number >>= 1 {
		if number&1 != 0 {
			counter++
		}
	}
	return counter
}
```

## 算法3

算法复杂度是O(N),其中N是十进制数字的二进制位数中是1的位数。
比如：十进制16，二进制表示为：1 0000
计算出16的二进制数中1的个数需运算1次（一个1）。
十进制15，二进制表示为：1111
计算出15的二进制数中1的个数需运算4次（4个1）。

```go
func subtractCount(a int) int {
	counter := 0
	for counter = 0; a != 0; a &= (a - 1) {
		counter++
	}
	return counter
}
```

## 算法4

算法复杂度是一个动态值，范围是O(1)至O(1)*255,因为如果是数字0，则运算一次就得出结果。
如果是数字255，需经过255次运算才能得出结果（因为需要执行255次`case`语句）。
比如：计算出0的二进制数中1的个数只需运算1次，
而计算出255的二进制数中1的个数需运算255次。

```go
func switchCount(number int) int {
	counter := 0
	switch number {
	case 0:
		counter = 0
	case 1:
		fallthrough
	case 2:
		fallthrough
	case 4:
		fallthrough
	case 8:
		fallthrough
	case 16:
		fallthrough
	case 32:
		fallthrough
	case 64:
		fallthrough
	case 128:
		counter = 1
	case 3:
		fallthrough
	case 5:
		fallthrough
	case 6:
		fallthrough
	case 9:
		fallthrough
	case 10:
		fallthrough
	case 12:
		fallthrough
	case 17:
		fallthrough
	case 18:
		fallthrough
	case 20:
		fallthrough
	case 24:
		fallthrough
	case 33:
		fallthrough
	case 34:
		fallthrough
	case 36:
		fallthrough
	case 40:
		fallthrough
	case 48:
		fallthrough
	case 65:
		fallthrough
	case 66:
		fallthrough
	case 68:
		fallthrough
	case 72:
		fallthrough
	case 80:
		fallthrough
	case 96:
		fallthrough
	case 129:
		fallthrough
	case 130:
		fallthrough
	case 132:
		fallthrough
	case 136:
		fallthrough
	case 144:
		fallthrough
	case 160:
		fallthrough
	case 192:
		counter = 2
	case 7:
		fallthrough
	case 11:
		fallthrough
	case 13:
		fallthrough
	case 14:
		fallthrough
	case 19:
		fallthrough
	case 21:
		fallthrough
	case 22:
		fallthrough
	case 25:
		fallthrough
	case 26:
		fallthrough
	case 28:
		fallthrough
	case 35:
		fallthrough
	case 37:
		fallthrough
	case 38:
		fallthrough
	case 41:
		fallthrough
	case 42:
		fallthrough
	case 44:
		fallthrough
	case 49:
		fallthrough
	case 50:
		fallthrough
	case 52:
		fallthrough
	case 56:
		fallthrough
	case 67:
		fallthrough
	case 69:
		fallthrough
	case 70:
		fallthrough
	case 73:
		fallthrough
	case 74:
		fallthrough
	case 76:
		fallthrough
	case 81:
		fallthrough
	case 82:
		fallthrough
	case 84:
		fallthrough
	case 88:
		fallthrough
	case 97:
		fallthrough
	case 98:
		fallthrough
	case 100:
		fallthrough
	case 104:
		fallthrough
	case 112:
		fallthrough
	case 131:
		fallthrough
	case 133:
		fallthrough
	case 134:
		fallthrough
	case 137:
		fallthrough
	case 138:
		fallthrough
	case 140:
		fallthrough
	case 145:
		fallthrough
	case 146:
		fallthrough
	case 148:
		fallthrough
	case 152:
		fallthrough
	case 161:
		fallthrough
	case 162:
		fallthrough
	case 164:
		fallthrough
	case 168:
		fallthrough
	case 176:
		fallthrough
	case 193:
		fallthrough
	case 194:
		fallthrough
	case 196:
		fallthrough
	case 200:
		fallthrough
	case 208:
		fallthrough
	case 224:
		counter = 3
	case 15:
		fallthrough
	case 23:
		fallthrough
	case 27:
		fallthrough
	case 29:
		fallthrough
	case 30:
		fallthrough
	case 39:
		fallthrough
	case 43:
		fallthrough
	case 45:
		fallthrough
	case 46:
		fallthrough
	case 51:
		fallthrough
	case 53:
		fallthrough
	case 54:
		fallthrough
	case 57:
		fallthrough
	case 58:
		fallthrough
	case 60:
		fallthrough
	case 71:
		fallthrough
	case 75:
		fallthrough
	case 77:
		fallthrough
	case 78:
		fallthrough
	case 83:
		fallthrough
	case 85:
		fallthrough
	case 86:
		fallthrough
	case 89:
		fallthrough
	case 90:
		fallthrough
	case 92:
		fallthrough
	case 99:
		fallthrough
	case 101:
		fallthrough
	case 102:
		fallthrough
	case 105:
		fallthrough
	case 106:
		fallthrough
	case 108:
		fallthrough
	case 113:
		fallthrough
	case 114:
		fallthrough
	case 116:
		fallthrough
	case 120:
		fallthrough
	case 135:
		fallthrough
	case 139:
		fallthrough
	case 141:
		fallthrough
	case 142:
		fallthrough
	case 147:
		fallthrough
	case 149:
		fallthrough
	case 150:
		fallthrough
	case 153:
		fallthrough
	case 154:
		fallthrough
	case 156:
		fallthrough
	case 163:
		fallthrough
	case 165:
		fallthrough
	case 166:
		fallthrough
	case 169:
		fallthrough
	case 170:
		fallthrough
	case 172:
		fallthrough
	case 177:
		fallthrough
	case 178:
		fallthrough
	case 180:
		fallthrough
	case 184:
		fallthrough
	case 195:
		fallthrough
	case 197:
		fallthrough
	case 198:
		fallthrough
	case 201:
		fallthrough
	case 202:
		fallthrough
	case 204:
		fallthrough
	case 209:
		fallthrough
	case 210:
		fallthrough
	case 212:
		fallthrough
	case 216:
		fallthrough
	case 225:
		fallthrough
	case 226:
		fallthrough
	case 228:
		fallthrough
	case 232:
		fallthrough
	case 240:
		counter = 4
	case 31:
		fallthrough
	case 47:
		fallthrough
	case 55:
		fallthrough
	case 59:
		fallthrough
	case 61:
		fallthrough
	case 62:
		fallthrough
	case 79:
		fallthrough
	case 87:
		fallthrough
	case 91:
		fallthrough
	case 93:
		fallthrough
	case 94:
		fallthrough
	case 103:
		fallthrough
	case 107:
		fallthrough
	case 109:
		fallthrough
	case 110:
		fallthrough
	case 115:
		fallthrough
	case 117:
		fallthrough
	case 118:
		fallthrough
	case 121:
		fallthrough
	case 122:
		fallthrough
	case 124:
		fallthrough
	case 143:
		fallthrough
	case 151:
		fallthrough
	case 155:
		fallthrough
	case 157:
		fallthrough
	case 158:
		fallthrough
	case 167:
		fallthrough
	case 171:
		fallthrough
	case 173:
		fallthrough
	case 174:
		fallthrough
	case 179:
		fallthrough
	case 181:
		fallthrough
	case 182:
		fallthrough
	case 185:
		fallthrough
	case 186:
		fallthrough
	case 188:
		fallthrough
	case 199:
		fallthrough
	case 203:
		fallthrough
	case 205:
		fallthrough
	case 206:
		fallthrough
	case 211:
		fallthrough
	case 213:
		fallthrough
	case 214:
		fallthrough
	case 217:
		fallthrough
	case 218:
		fallthrough
	case 220:
		fallthrough
	case 227:
		fallthrough
	case 229:
		fallthrough
	case 230:
		fallthrough
	case 233:
		fallthrough
	case 234:
		fallthrough
	case 236:
		fallthrough
	case 241:
		fallthrough
	case 242:
		fallthrough
	case 244:
		fallthrough
	case 248:
		counter = 5
	case 63:
		fallthrough
	case 95:
		fallthrough
	case 111:
		fallthrough
	case 119:
		fallthrough
	case 123:
		fallthrough
	case 125:
		fallthrough
	case 126:
		fallthrough
	case 159:
		fallthrough
	case 175:
		fallthrough
	case 183:
		fallthrough
	case 187:
		fallthrough
	case 189:
		fallthrough
	case 190:
		fallthrough
	case 207:
		fallthrough
	case 215:
		fallthrough
	case 219:
		fallthrough
	case 221:
		fallthrough
	case 222:
		fallthrough
	case 231:
		fallthrough
	case 235:
		fallthrough
	case 237:
		fallthrough
	case 238:
		fallthrough
	case 243:
		fallthrough
	case 245:
		fallthrough
	case 246:
		fallthrough
	case 249:
		fallthrough
	case 250:
		fallthrough
	case 252:
		counter = 6
	case 127:
		fallthrough
	case 191:
		fallthrough
	case 223:
		fallthrough
	case 239:
		fallthrough
	case 247:
		fallthrough
	case 251:
		fallthrough
	case 253:
		fallthrough
	case 254:
		counter = 7
	case 255:
		counter = 8
	}
	return counter
}
```

## 算法5

算法复杂度是O(1)，可以说是效率最高的了，**perfect！**即每次都只需运算一次就可以得出结果。
比如：计算出十进制数0-255的二进制数中1的个数都只需运算1次。

```go
func tableCount(number int) int {
	table := []int{
		0, 1, 1, 2, 1, 2, 2, 3, 1, 2,
		2, 3, 2, 3, 3, 4, 1, 2, 2, 3,
		2, 3, 3, 4, 2, 3, 3, 4, 3, 4,
		4, 5, 1, 2, 2, 3, 2, 3, 3, 4,
		2, 3, 3, 4, 3, 4, 4, 5, 2, 3,
		3, 4, 3, 4, 4, 5, 3, 4, 4, 5,
		4, 5, 5, 6, 1, 2, 2, 3, 2, 3,
		3, 4, 2, 3, 3, 4, 3, 4, 4, 5,
		2, 3, 3, 4, 3, 4, 4, 5, 3, 4,
		4, 5, 4, 5, 5, 6, 2, 3, 3, 4,
		3, 4, 4, 5, 3, 4, 4, 5, 4, 5,
		5, 6, 3, 4, 4, 5, 4, 5, 5, 6,
		4, 5, 5, 6, 5, 6, 6, 7, 1, 2,
		2, 3, 2, 3, 3, 4, 2, 3, 3, 4,
		3, 4, 4, 5, 2, 3, 3, 4, 3, 4,
		4, 5, 3, 4, 4, 5, 4, 5, 5, 6,
		2, 3, 3, 4, 3, 4, 4, 5, 3, 4,
		4, 5, 4, 5, 5, 6, 3, 4, 4, 5,
		4, 5, 5, 6, 4, 5, 5, 6, 5, 6,
		6, 7, 2, 3, 3, 4, 3, 4, 4, 5,
		3, 4, 4, 5, 4, 5, 5, 6, 3, 4,
		4, 5, 4, 5, 5, 6, 4, 5, 5, 6,
		5, 6, 6, 7, 3, 4, 4, 5, 4, 5,
		5, 6, 4, 5, 5, 6, 5, 6, 6, 7,
		4, 5, 5, 6, 5, 6, 6, 7, 5, 6,
		6, 7, 6, 7, 7, 8,
	}
	return table[number]
}
```

## 总结
相比较算法1和算法2，算法3效率更高，算法4的计算效率是一个动态值，其计算效率依赖具体的数字。
相比之前3个算法效率有时候反而更低。但是该算法提供了一种很好的解决思路，即借助空间（内存）换取时间，将已知的值全部列出来，可以使用查找表实现算法，于是有算法5。算法5是通过查找表方式实现，通过空间（即内存）换取时间。由此可以看出，在不同的应用场景需选择不同算法实现，例如在内存很充裕且追求最高计算效率情况下，算法5是最适合的。但是在嵌入式开发过程中，内存受限且追求计算效率时，那么算法3是最适合的。
