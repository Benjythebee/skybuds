import { expect } from "chai";
import { ethers } from "hardhat";
import { SkyBuds, SkyBudsMetadata } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { decodeMetadata, encodeMetadata } from "./test_utils";

describe("SkyBuds NFT Contract", function () {
  let skyBuds: SkyBuds;
  let skyBudsMetadata: SkyBudsMetadata;
  let owner: SignerWithAddress;
  let collector1: SignerWithAddress;
  let collector2: SignerWithAddress;
  let skybudsAddress: string;
  let mockMetadata = {
    wearables: [1,2,50,30],
    isTalkative: 1,
    laziness: 2,
    speed:60,
    color:'#FF0000',
    imageUri:"/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDAA4KCw0LCQ4NDA0QDw4RFiQXFhQUFiwgIRokNC43NjMuMjI6QVNGOj1OPjIySGJJTlZYXV5dOEVmbWVabFNbXVn/2wBDAQ8QEBYTFioXFypZOzI7WVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVn/wAARCAIAAgADASIAAhEBAxEB/8QAGwABAAIDAQEAAAAAAAAAAAAAAAECAwQFBgf/xABGEAACAQMABgYHBAoBAwMFAAAAAQIDBBEFEiExQVEGEzJhcYEUIjNSkaGxQnLB0RUjJDRDU2KCkuHwBzWiJXOyRFRjwvH/xAAZAQEAAwEBAAAAAAAAAAAAAAAAAQIEAwX/xAAkEQEBAAIBBAMBAQEBAQAAAAAAAQIRAwQSITEyQVETImFCkf/aAAwDAQACEQMRAD8A9EADc8sAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB5jpK36fTXDql9Wcc63SP/ALiv/bX1ZyTByfKvS4vhG1DsR8CxWHYj4Fjm6gAAtDeWKw3lgAAACXZfgA9zA1QAAMN17JeJmMN17LzCHqejLzoeC5SkvmdY43Rd50TjlUkvodk9DD4x5nJ86AAuoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADynSH/ub+4jlnS09/3Wr4R+hzTz8/lXp8fwjbj2V4GK4uqNtHNaajyXF+Rkyo08vclk4K/XVZ15rMm9mduEVk2va6L0nBtalCq1zeF+JtUa8K6erlNb0+ByDYsW1cxS4pplrijbrQ3lisN5YosAAAHuYD3AaoAAGK59k/EymK59iwOz0WvYxnUsZLD9pB8+DR6U8H0Zqyn0jhFx1XGEtzzlYPeG7iu8Xnc81mAA6uIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABtJZexAAatbSVlQWat3Qjxw6iy/I06vSTRVLP7UpNcIwk8+eMEXKRaY5X1HWB52r0w0fB4hTuKneopL5s15dNKGPVs6jffNIr34/q38s/x6oHkJdNXt1bDwbq/wCjG+mlfOyzpJd82R/TFP8AHP8AHsweGl0zvfs0LZeKk/xMM+mGkXudvHwj+bI/rin+GboabedLV8f0/wDxRzzmXOl7i5rzq1KkVOW/EUYXf1X/ABfgjLlN21ux8YyPQXH7rV+4/ocaHYRry0hVlFxdabT2NGNXLW6TEmk1vGey/eoef0OdG654fyNuxuKfpUNb1e97hfSHdhvLFYbyxzXAAADAA1QAAMdx7GRkMdf2MgO70R/drj76+h6A850Qf6u6XHMfxPRm/i+EebzfOgAOjkAAAAAAAAAAAAAAAAAAAAAAAAAACIyUlmLystfAk5+ha/pFpVlt2XFVLPLXb/E6BEu5tNmroABKAAAADi6U6SWejqs6OJ1q8cZjDcvFkWye0zG5XUdow3N3b2kFO5rU6UXuc5Yz4czwd/0vvq8pKjKNtB7lBZl8X/o8/Wuqlao51JSnN75TeWzleWfTvj09+30ar0r0XTzq1KlXHu03t+ODTq9M7deytKs/vSUfzPBOrN8SHKT3tnP+uTtODB7Gr00uXnqrWjDlrycvyNGr0t0lPs1qVP7sE/rk80CO/L9WnFhPp162nr+qsSvq+P6ZOP0NKreTqvNSdSo/6pZNUFd2rySemV1nwiQ6su5GMEJZNeTTzJldaXN/EqSAy+bAAAAAAAAJRBKAkIAql7C2z1FPLy9VbfIzGG29jD7qMxRYAAAAAaoD3gAUreyl4FylX2UvADrdEGs3a4+p/wDsemPL9EX+vuVxcYv5s9QbuL4R5vP86AA6uQAAAAAAAAAAAAAAAAAAAAAAAARKSjFye5LJJraSn1ejbqecatKb+TIpJu6cXoVWdTR1xF71Xcvil/s9GeO6CVPXvaXNQkvn+aPYlOK7xjrzTWdAAdHIAAB7Vvx3nxy6dVXNWNaTlUU2pPm87T7GfLOlNu7fpDeRxhTl1i79ZZ+uTjzTxK09PfNjkgAztaQFuAAAAAAAAAAkgkAAAAAAAAAEAgLAAql7GgsUoLlFGUx0ewvBGQosAAAAANV8Tl169SrL1akoJPZq7Dp1OzPwZxy2KtTC9uaFRdY+upPuSaOrKSnQclulHK+Bx5x1otHRtM+hYbzhNE5QjsdEn+13C500/merPJdE3/6jVjzpN/NHrTXw/Fg5/mAA6uIAAAAAAAAAAAAAAAAAAAAAAAAc3pDPq9BXkucNX4tL8TpHE6Wz1dBVV704r55/Arn8avxzeccToWupv5aza62m0l4NNfie2PB6DuNTTFg84U5OLxxzCX44PeHPhv8Al16mazAAdmcAAA8J/wBQLfVvbS4S7dNwb8Hn8T3Z5vpzbqroJVcbaNSMs9z2fiinJN4104rrOPnQAMj0EoEIkAAAAAAAAASQSAAAAAAAAACAQFgAVS9lR7C8EZCseJYosAAAAANWptUvM4x2Z/aOMXxVob9n+6vxZoG/Y7beX3mTl6I6fRV40pNc6TXzR7A8Z0YbWlljjCR7M08PxYeo+YADs4AAAAAAAAAAAAAAAAAAAAETlGEXKTxFLLbA17+7VpR1kk5vZFMyW1eNzQjVhufDkzz95cO5rSqPs7orkjJom79HueqnLFKpz4S4P8DDj1O+XX00Xi1hv7ehPP8ATTP6E2fzY/RnoDz/AE0kloaC51or5M18nxrnxfOPG6OuHTvtHy2xUK8ZS54ys/Vn1I+T059XUjP3WmfWDlweq79VPMoADQyAAAGlpm29L0Rd0OMqUtXxSyvmboIvkl1dviwNrSlt6JpO6t8YVOpKK8M7PkapienLvyLeSQSEgAAAAAAABJBIAAAAAAAAAlbyCVvAkAtDtx8SqXso8SxWPEsUWaNzJqs8N8DHry95/E26lvGpJycpJvlgp6HDHtKny/IvLFdL21WU4tS2tcTMY6NFUU0pSlnngyFalry7T8SkqcJdqEX5F5dp+JBCWF2tF/Yx4MvSpRpRcY5w3naXBO0MnRttaZprnGSfwPaniOj2Vpyh/d/8We3NnB8WHqPmAA7M4AAAAAAAAAAAAAAAAAABx9L3etL0am9i7bX0N3SF2rWj6rXWS2RXLvPPpZbk3tZh6rm1OyO/Dhv/AFUPczFJa0WjO1sZiwec1PQaJvfS7bE3+up7JJva+85fTWUXoujBNa/XKWrnbjVltNBVK9tUdW2qdXUaxnGTzl7c3FavP0icnPLzlnoYc/dh23254cP++5EKWsvW3PgfS9F30NI2NO4hsbWJr3ZcUfLvSFS457jo6I07LR8n1UnBSeZRksxkW48+2uvNx/0nj2+lg4ujukdpdpRqyVGfPOYvz4eZ2k00mnlPc0a8cpl6eflhljdWAALKgAA+b9N7bqdPSqJYjXpxnnvWx/T5nnj3P/UG3zb2dyl2Zum34rK+jPDGTkmsq9Diu8IErcQSijoAAAAAAAAAEgAAAAAAAACVvIJW8CSYvEk+TIBVZ7SPEkx0Ja1GEucUzIUSAAAAANeXafiQWn234lQAAAaE2abt8+8/oz3J4TROzTVvn+Ye7NnB8WHqflAAHdmAAAAAAAAAAAAAAAADFcV4W9F1J7luXN8jKed0vdddc9XF+pS2eL4nHn5f547+1+PDuumGtWlc15VJ73w5LkQUjnV27yTxrbbut2tJk0ovwMSaZd7mYFtSYGSS1k0aF9SjOyrxVGEqrw1PHrLHDPgbqbRirtpZS3lsbcbuJebwktx9CsdEWNzoezVzZ0ZzdGDlJxWtnVXFbTwukqXVpzivVlv7j6ZaQ6uzoQ92nFfI9Lp9Zbrl1OXiacKv0N0fKTlbVK9rLhqzyvnt+Zjt9F6c0W/2S7o3VLe6dTMM+W1fNHpwaP54+2acuWtXy5lvpSovV0haVbWa+3jWg/NZxu4nSi1JJxaafFEgtJpS2X1AAEocbpbQVfo7dbcOCU15Nfhk+Xn17S1LrtE3lPjKjNLxwz5CZ+aeWzp7/mwJRBKOLQkAAAAAAAAAAAAAAAAAACUQSBIAKrPWaPlrWVF/0JfI2TS0RLW0dSfJNfNm6USAAAAAME+2/EqWn22VAAADHo/Zpm3b3dcvqe9PnFw3GNRptNSymuG099o2cqmjbSc5OU5UYNt728I18F8aYupnqtkAGhlAAAAAAAAAAAAAAAAamkbr0W2bT/WS2R/M8jcXlCin1lSOVvinl/A9jc2VtdSjK4oxq6u5S2r4bmcbS3RS0vX1lri1rcVFepLy4eRk5+HLku9u/Fnjj4rk0tI0arioRm9bdsNjrecJr+0xUdHRsa84upGq47MxWxGweblNXTUxutFxeyov7JfkYnVhFtTnGMuTa2GyCEtZVab3VIPzQm4yg1rLu2lq0Fra2FtMdtoz0q4k4dVqpNyjJ4bWNuC2OPddRFuptqV6aq0pQaznge6sbqne2dOvRWISW5713HzGhKqqkIwnJZaSSZ9K0bo6lo6g6dJuTlJylJ75P/nI39Njljb+OPUSSTbcABtZAAAAABE4qcJQlukmmfGZxcJyhLfFtM+znyLS9NUdL3tNLCjXml4azwcOb6aenvmxpkreQDg1rAAAAAAAAAAAAAAAAAAAAALAElUvR6Dlmwxyk0dE5PR9/s1WPKefkdYrUgAISAADBPtsqWqdtlQAAA0alCFe8hCprJOaT1Xh4PolClG3t6dGGdWnFQWd+EsHz9vVvYvfiSZ9DNfB9sXU/QADQygAAAAAAAAAAAAAAABpaTu/RqOrB/rZ7F3d5t1KkaVOU5vEYrLZ5q4ryua8qstmdy5IzdTy9mOp7rrxYd13WIAHkNgACRWoswfcYIylB5jJxeGsrvWDZNacdWTRMuhxFRdrcQlVklGE0889p9JtLuheUust6inHjjevFHgtJ2zrUVOPapvWxzRgtL2tbVIVaMqlCpJZjlY1l57GjfwcuocnHOSf9fSwcDRvSSjWSp3uKNThNdl/kd9NNJppp7U0bccpl6YM8MsLqgALKgAAHy7pZT6vpHeJbm4y+MUz6ifO+nVNw07GXCpRi/m1+By5fi79Pf8ATzQAMzasAAAAAAAAAAAAAAAAASouTxFNvuAgGaFpcT7NGfmsGaGjLqW+Cj4yA1VuJOhHRM0l1lSK+7tNinY0IYzHXfORCVuj8klcJtLsv6naOYkorCSXgbsbiGqs5zxK2JZgYvSIc38B6RDv+BVLKDF6RT5v4D0inzfwArU7bKkTqxcm1kpKtTgsykl4gZAY416c4pxlsfcW6yHvIDVrNxuG+WGfRT5zcbara2ruPodKpGpTi1JSbSexmrg+2PqfpcAGlkAAAAAAAAAAAAAAAAcTS931tX0eD9SD9fvfLyOcQlhd5J4fJnc8u6t+OMxmoAEMosnIyQAJyYa+MJ+RlMdf2T7iRhO5o1WmkLD0K5oU5qnui48Oa5M4CeDPbXErevCrB4cX8VyO3Dyfzy39K5490b150TpuTlY15UVj2dTM4+T3r5mhRudK6Bm416M3QW/OZU/KS3f82HsKFaFxRjVpvMZIyNJrDWUz0/5y+cfDNObKf5y8tHR2lrXSCSpTxUxl05b/APZvHKu9A2ddqdGPotVbVOj6vy3FreWkbNqncx9Mope2p7Jrxjx8sstLZ7VsxvnF0wUpVYVoa9OSlHd4PkXLuYeG/wCoNPFzZVdnrQlHv2Nfme5PAaRarXtfXxJdbJpPat7OXLfGnfgx3lt5UHfdvRe+lD/FFXZ27e2lEzNrhrcSejVhardRiWVrbr+BT/xQHmgeoVGkt1OC/tRdJLckgPLKnN7oSfkWVvWluo1H4RZ6cAebVncvdRn5rBdaPunuovzaPQgDgx0XdPfGMfGRmjoeo+3VgvBZOwAObHQ9JdurN+CSM0dGWsd8HLxkzcAGGNrbw7NGGeeqZkklhJJdwAAAARJZizCZzC1h4ISg2reVuqbVaLcs8M7jVEpKEXKTwkQN9ysvcl8/zKudn/Lm/N/mcqd9TXZi5fIwTvastixHwI0nbtyq2UVl05Lxf+zWq6QsYp6lGc5eLSONKUpvMpNvvKltI22699Oo/UhGlHkst/FmslOtUUE25S4sq3hG/Y0dWDqSXrT3dyHo9slNRpxUVFNJY2mRSp8YS8pf6KAqsyrqHvdSL8Ey6o0ZbrhLxjg1wBvQpVk80brb/TNipd6VskqlK5qSit6b118GaJMqtSEJas5LZwZMtnpW4y+49toO+qaQ0dGvWjFTcnH1d2w6B4zopeXEtIK2dV9Rqylqd57M28eXdi87lx7ctAALuYAAAAAAAAAAPJgxK5oPdWp/5Isq1N7qkH/cjwNPRXIZClF7pL4iUlHtNLxYEgwu5oR31YeUh6TTfZ15fdg3+BOhmKVlrUZruZidw84VGq34JfVlKt1UhDW6jZ3y3DSVIPWinzRJhtpZp45MzE0dXQd91FbqKjxTqPY29kX/ALPSnzOWkZwqypzpJNPdngdu26Yyp0Ywr2rqTisOaqYz5YPR6fO449uTPy8Vt3i9iDzEOmVq169rWT7mmZ49L9HS3wuI+MF+DNPfj+uP8s/x39WKk5aq1nxxtJONHpPoqW+4lHxpy/BGeGntFzeFeU/PK+pPdj+q9mX46R88qS1qk5ZzltntZaWsJU5uF7btpPCVRZ3HiDly3009PLN7At6AW9HBpbIAAAAAAAAAAAAAAAAAAAAAYprEjKYq8lCGtJ4QFUUravVSUmkmuLNapecKa82aspym8ybbISqACUAAfJbW9iQEZ9deq5JPLXM2/T6n8h/E2KVDqIKGcy3t95crVo0vTJ8aD+P+iyvHxozNsEJajvYLtQmvIn06j/UvIm5inNZSezidS06H3FxQpV/SqMIVYqaWo5NJrKLY43L0plnMfblq8o+815CV1RlBpTW7kz0tLoZTj7S9cvu0Yr8zeo9F7Oltda4n4uK+kS/8cnO9Rg4XRDEtMZT2KnJ/Q9yadnoy1s569GD18Y1nJvYbho48bjNVj5c5nluAAOjmAAAAAAAAAADw1LR/R+Xale0/GSf0RvaRp2lw7WNp1Tt6UMYUcSzs3/BHHgteSjHa2dOlBU4KKPM5uTWPbJ7eh2au9odtQe+jT/xREbahF7KNP/FGUkx7qURjGPZSXgiQCRiqramY2k001lMz1FmD7jAEuTcLqKmo5yit6abWfgbVDR2kK9GFWhCvOnNZjJSzn4mW7t1cUsY9ZdlnY6NaTtqOjqdpXqdXODlhz2J5be/zNXDjjn4yqM7ZjvFp3fRO5uq8HTuVCjqJvrVmcZPetiWw85f2Vxo26dvdQxL7Ml2Zrmj6mmmk08p7mjT0no230pauhcwyt8ZLfF80brwzX+WbDnsv+nzAG7pfRVxoi56ut69GT/V1Vul48maRns14rXLLNwIJAStS21YfeR1DlJtNNbGjPG7qLekwN4R7S8TVjeL7UGvBmWFzSclmWNvFAbwMDu6C/ifJlXe26Xbb/tYGyDVd/RXvPyIekKPKb8gNsGn+kaWexU+C/Mj9Iw24py88AboNH9IrHs38SHpLZspf+X+gN8HOekpcKSX93+iktIVnuUY+QHUDaSy3hd5xpXVeW+rLy2fQxNt7234gdmVzRjsdWOeSeTFK/ordrS8F+ZygB0JaR92n5tmKV/We7Vj4I1ABllcVpZzUlt78GN7Xl7yCHJR3tICQY3WjwyyY9bUkkkoZ2ZZMlvoXKupGO9m9T0TnbWrOXdE26Vlb0uzSTfOW0rtOnHgqtX2NKUu/Gw37GzqQq9bXUcperFbcM6IK2p0wVe2UL1u35FAkAAGC47S8D3+hHraGtG/5aR4C4+ye56NS1tBW3Nay/wDJnfh9svU/GOoADUxAAAAAAAAAAAAAAAAPC6Pt9SPWSXrS3dyN0JYWEDwcsrld16QSQSREAAAGu1htGwYaqxLPMJUOdfxnRl1sMOEt6fM6JMXqyTwnh5w1lMvjl23aZdNGw0zXtJLqqjgvce2LPT2HSK3uEo3C6mb+1vi/yKLQmi9KW6qwpdRN9rqnjDxuxuOZcdE7qis2lxCr/TJar/I9LGZ4zePmOOWXFyeMvFepuKFtpG0dKrGFahUXPK8UzwGndB1tD1esjmpZyeIz4w7pfmbEK2lNDyzUp1qCzvxmD/Bncs+kdtd0nRv6cVGa1ZNLMWu9Frnjn4y8VEwy4/OPmPD7QemveilStVdXRFzQdtLaoTk/VfJNJmjPoppmG6NCp92f54KdmTpOXH9ccG/d6C0tZ0J1q1tFUoLMpKpF4+eTma9Rb6ZHZl+Lyy+mQGPrZcabHXc4yRGrEsgMfXx5MddDm/gQMgKdbD3iesh7yAsCNePvL4k5XMAAAAJIAAhyUd7SKdam8RTk+4DICmrXktkVBd+wn0dvt1E+4tMbUbg6kFx+BTrZS7EH5mZUKcePyLake9/I6TDD/wBZI7o19WpLtSwu4lUorfl+JnfVrh8WRrU+UfidZlw4/R3RSMo0/W1U0t6MzjCcOsovWhxXGJjcqTWHqfH/AGXpYpvWppRyuHEjLm87x9K3L7js0XmjTfOK+hc1LatOdLbjY8bEZeskY7PLtMtxlBEJay7ySqWGt214GMyVu0vAxkgAAMNx2V4nsuics6Gis5xUkvA8dcdheJ6robLOja0eKrN/FL8jtw/Jn6j4PQgA1sAAAAAAAAAAAADaSy9iObd6Wp0sxopVJ8/s/wCyLZEzG5enQqVIUoOdSSjFcWzjXum98LRf3yX0X5mhcXFW5lmtNy5LgvIwaseRyudvpow4pPbIADxWgbS3k5MVTtU1zl+DLkpWBXJOQJKVVmOeRfIaymghrAPZvKuXIlLo6KvVaXGrUlilPZLufBnpt62Hhjv6D0hrxVpVfrr2b5rl5G7peXX+Kz82G/8AUdprKw9qOXd6A0ddZfUdTN/aovVfw3fI6gN9kvtmmVx9V5l9H76ym6mj7zP9L9Vvu5P5HR0be386/o19aSjJJvrV2Xj5fA6oKzCS+HS8tymsptz9PR1tCXixn9W38D5oz6hpWOvom8jjLdGePgz5ezvhXbp/VWUJajnj1VxKmxOUXSjTSerHv3mFyhHeop95znUzzt2mapPVt/Yz5EO5itifwRR3Kzsi34srep/Inuv4v1H9MfkPR48dVGJ3EuCRV1580vI53n39Q/0zejU+fwyPRqXvS+BgdWfvMjrJ+8znc9/U/wDhrJn9Gpp9ufwJ6j3ak0a3WT96XxNqg26SbeXkpvaLufaOrq8Kz8yOpqPtVNncS5PO8qap01+6mS/q0beC35b7xKtGm3FJ+C3E0362DBcrFTPNHDkw7LpXXnVWdy+EfiUdeb4peCMYOa/bF3Um/tMq23vbZACQBkASb1J/qovuNA3qfsF90mKZupZ0s26kn2tuDP1XeU0e82VN+P1ZsFMr5rrJNMcI6uS4BVLBW3oxmWutscGlcTqJ6iwueCYis7kk8ZWV3jWj7y+JpxjhbylR1EvVSa+ZbSNtyv7Nno+hcs0buHKUX8c/keSpVJyg4vYuTPUdC5YrXcOcYv4Z/MvxfKOXP5wr1gANjzwAAAAAAAAAAcjpOp/oapKm2nCUZNp42Zx+J4yN5cR3VG/Hae/0rSdfRd1TW903jxwfODhye2vgv+dNyOkqy3qEvIyx0p71L4SOcDnt309KADykMcttePdFv5r/AGXKR216j5Rivq/yLkpAAAAAGvV2TZQy11uZiJArKdSklUotqpD1o43lgTLoet0Vfw0jZxrQazuku83D57bXlbRN++pnqU621ZWVnO49VZ6XruMfTrKrTUtqq0o9ZB/DOD1eLmmU8snJxWXcdgGOhcUrinr0akZx5pmQ0ODFdR1rWtHGcwkseR8oe8+uNKSae57D5HNOM2nvTLY3y1dP9ssZJ8dpq3S/WJ80ZIPEkLqOYJ8mZeXDtvh31qtQEjBxXAAAAAA27b2Xmaht23sl4kxXP0h72QJb2QerPSy0H66Iul6sX34IMtZa1F48TH1M8yqZeLK0QAZV0ggASyAABvx2UV900N5vy2UvInH2pl9OrozbZR7mzaNPRTzZ+Embpzy+Vd56VBJBUY6i9aPdk505a02+bNy8Waa8znw3F8VasACyqq2M9F0OljSVaPB0W/mvzOF/DR1eiMtXTKWz1oSX4/gTx/JXl84V7oAG15oAAAAAAAAAAIlFSi4yWU1ho+Y1odVXqU9vqScdvcz6efPdPUuq01dRxjM9b47fxOXLPDR0982OeADg1PSg1420sbLisvNP6ot1Fddm6f8AdBM8zSFqO3rpc54+CSLlYwnSoaqxUnlvb6ucvJj/AGprsUU++b/IlLMDC1dJbqOfFkftXB0V5MDODBq3LftKa8IP8x1dxnbXj5U/9gZKqzTZrl5Uq+q/2h5x7iNXqKrW26n5RivwJkGcGrVt6mo3CvWclwbW35Gj1lV/xqn+RfHDu9JkdC9t1c28oYWtvi+TO90Rnfq2lSu7erTppZjKpHGX3Z/58TyKlNNZqVJLk5vb8z6Ro24o3VhRqW61aerhRz2cbMGzp+PV81w59zHTO6cHNTcIua+1jb/zYiwBuYw+TXsdS9rwxjVnJY8z6yfKdL+rpm9iljVrzX/kyN6saen91rZM1Ra9F+GTXNik8w8CvPNzbRl+tDJOSakHCbWNmdhUyLmQAAAAA3bf2MTDRt3LDlsjy5my3GnHC2ckWxlt1FMrvxGB7wAeouGan60MPwMJMZOO45cuHfNRGU3GGpRnB7srmjGbyqrisCVOnU4LPcYcuPLH3Fe6z20QbLtXn1ZbO8K05z+RRPdGsWp05VHiK8+BtK1gtrbZZ1IwWIrOC2ONy9Hdv0U6MKSy9r4tlatTKwt3MpKTlvZVnecUxm6TH7rs6Gf7LU/9z8Eb7NPRVLq7KL41G5M3GYsvbtEMglkEDBd+zRzYbjp3Xs14nMhuZbFXJYAF1V/4Rv8ARiWrp2324T1l/wCLNH+EbGgpaum7V7faJbO/YRh8kZ/GvowAN7zAAAAAAAAAAADxfS+k6ek6dVp6tSmsPvW9fT4ntDi9KrT0jRTqRWZ0Hrrw4/n5FM5vF04stZPDZQyVJMzc9SlhYAB5aAAARLcULy3FCQAAAwVFiXiZylSOY96AwnPvKGpLrI9l71yOgVnFTg4y3NYOmOXbdrS6cg7/AEW0j6Ncu0qP9XXfqtvdL/exfA8/Vp1qNVxerJcG+KEJzTT1XFrblPca8ctXcTljM5p9SBz9CaQ/SNhGpLCqxerUS58zoG+Xc3HmWXG6ofNulti7PTlSovZ3P62Pjx+f1PpJ5/pnYel6HdeENarbPXTW/V+1+fkRl+unDl25Pnpkpz1HuymY08ok6WTKarf7bClCex4fc0Y520Xti3ExllKUdzZxvB+KduvTHK3qR4Z8CFQqP7DNhVnxSY66XJHP+OSf9MKtancvMz06MKWJPtc2V62fMq5NvLeS+PT37NW+2SVXhH4mPOd5ANWOEx9LSSJBBJZIACQIAIFteSW9kOUn9p/EgFe2fiNBAAAjVc5xhHfJpIk2NFU+tv4vhBORn5stRMd+MVCEYRWIxWESSQee6IZBJAQw3PsvM5kd7Onc+xZzF2peJbFXJYAF1WRezLaNlqaUtpPdGtB/NFV7Mx0Z6lzCfuyTKz2m+n1IAHoPKAAAAAAAAAAAK1IRq05U5pShNOMk+KZYAfL7+mrG+rW1R4lTljby4P4YNfrqfvHsumOhvTLX023hmvRXrKMds4/6/M+fmTOdt09DjymeO3uwRkZPKSkEZGQEihLlmerxxknVZIqCSAAAIGvOOrLBBlqrKzyMRZLDc0etp7O0tqOcdZs0bqlqy11ulv8AE7ceX0tjfpn0RpGro65coNak9k1JbO5+R6RaYr8YUmu5P8zxiN+hdVHTUdbbHia8OTt8Vy5eLu8x6ZaZrZ20qfzIlpeU4ShOhFxkmmtZrYee9Iq+98kOvq+/8jp/aOP8a85cUXbXVWg8vUlhZ4rgUN/TEJSnC4e19mT+hzztxZbjVPXlJJAOyUggkkSCASJBBJIAAkAAABAIEkAEACAVtESeEdfQdLVo1Kr+08LwRxpvcj01nS6m0pQ4qOX4mHny3dLYsxABnXQAAhiuPYyOWu3I6lf2MvA5f22XxVqwALKskewRbe3fgyY9gxRco1U479xX7WbtpOXU51nlvmbUbmvFYjWqLwkzJRsMUINS1W0m4tbmS7Kot0osjatxRG/vI7rqt/my8dKX0d1zU89phlbVYrLjldzMJPdf1S4z7joR01pCP/1GfGMfyLfp2/8A5sf8Ec0E9+X6jsx/HT/Tt/8AzY/4Ifp2/wD5sf8ABHMA78v07Mfx0/07f/zY/wCCH6cv/wCbH/BHMA78v07Mfx0/05f/AM2P+CH6cv8A+bH/AARzAO/L9OzH8dP9OX/82P8AgjyWkLfqbhyisQntWFsXcdoxXNFV6MoS3713Mjut9pmMnp2QAeeAAA16M9a+uF7kYL6v8TaOboyaqXN5NcZrD7tp0i2U1U0IwiQVQrqkarLgDG1wZrSWq2jdNe4hsUl4MmJYCs4KcHF8SxBYcyUXCTi96LQlqyTM99FRpuq/s7/A1aMalbaoOEOct78jTje6bX23k8rKBEIakdVNvxJLqsdxSVehOm8estj5M4Cytj3rYz0ZxtI0uqunJLEZ+svHj/zvO3Dlq6GsSVJNkqUggksJBAJEgAkAAAAAAAgbEkAFdgQAVtGWyoq5v6VNvEXLa+5HrfR6f/3EPgec0HS1q9Sq12Vhef8A/DuHncnmry6Z/Rofz4D0SP8AOgYAU0nbP6H/APlj8CVZZ/iL4GsBqm2eej9eDj1uM/0/7NanoWKqOVStrLko4L5fMnWl7z+JPk8LLRNut+u/Mt+jrSHaXxkalec9ZetLGOZgHn9R4dF29hHY9TykY4R0fRqqpTT11uw5bDSA0Ok9IUlujJlJaR92n8WaAGja95f1pRUYtQTznG9mO2lrUtvDYYrjsxL2qag8rCb2Eq1nAAVAAQAACAAAAAB1AAYUBStPq6M5+7FsuaelqmpYVNu2WIkybuktfQOeqrN8ZI6xytAr9mqP+v8AA6pbk+VTl7AAUVAAAIklKLT3MkiUowjmUlFc28EjRacW4vegRVuaFWquqqKb3PG74klkoMclhmQiSyi+GWqMeBgkGhKMGrpGj1ts2u1D1l+JuDCaw9xMurseYJLV6fVV50/dePIob5UrAgFpRYEAtsSSQCRIIBIkEAAAQRsAQCtoESewFqVN1q9OkvtPByzy1B3dFUuqsot75+s/w+Ru5KKKikksJbEhgw9ydr5GVzKYGCNm18rmMrmY8AnZtkyuYyuZjIGzaK6y1jaYtV8jMBs2xar5DUZlIGzamo+Y1O8uAjbHKlGWNbbguSQEAAAAAAAAIBJAAAAdQrKpCPanFeLPHz0hcT7Us+OWYndVn9rHkjjOC/pp7CV3bx31Y+W05el7unXpwhSeUpZezBwXcVX/ABJeTwZqbbgm22+bLzhmN2mTy7+hHq2snzm/ojrbzkaMlGnYpzkopyb2s2HpG3pZTqKXLG3acMpbldIs8t8HAuekDTaoU9md8jRhpG6uarVSo9XD2LYi04cr7JHp6tzQorNSrGPn/wA5M0ammqKerSTk+ctiRxq22JsW9pTr2sZPMZ7dqLzin2t2ye2zdX91hS1lGnvepsa8yKUqNxiWXOS/mPLXxNbqbi2TwlVp8Ui9CNtVeYx6ua914wdJjJ6TZPpvYWMcCsrqFNqMlKUuUYtlksJLLfewRljMlGP0ub7FtVf3sRI626lupU4fek39DMCOzERHW1VrtOXHG4sQCwkkqTkJcfTFLVrxqJbJrD8Uc87mlKXW2cmt8PWX4nBTNPHl4F8grkk7yoWJKkl5UpBBJOxIIBIkgEDYkgEFbRJGSCMlLUJydHQ1LWrzrNbILCfezm5PQaNpdTZwyvWn6z8zPy5eNJbuSMlcjJm0lORkrkZJQnIIyRkCxBGQBOSMkAlCQQAJBAAAAAAAAAAEAAAAAAAHlgAdEhtU2tRcDVM9LsIipjOnsBmjTjqpNEOjyfxNOXR8km55Ttq21vK6q6kWo4WW2dGdpStaK1FmTeHJ7ymjKTpVp6+FlYW3ebV77KP3vwZmyxyxuqj7c+e3KOho/wDdI+L+pz3vOhYfusfF/UonL02THUowq7ZL1luktjRkAUUhGUNjlrx5vei4AAAACSABIIABpNNPc9h5itTdKtOm/sto9Pk4+kaHW3PWUmnlLPideLHLK/5iXOTLJmT0SryXxKujUTw18zR2Zz3BBI6ufL5k6kuReTL8EEjVlyLKnN7ostJfwVBfq5+6wqVR/ZZbty/BQGR0KnJfEq6Ulv2C4ZfgoQZOrXMdXHvK9mQxZIybVGnBzw4prvNjqocIxXkTODLKb2NG2ouvXhBJ4b2tcuJ6c51vcyotRnth9DfjKM4qUXlPiYebDLG+RIBBxAAgAACUAAAAAAAAABAEggASQAAAAAAAAAAAAHlgdelommttScpPktiN2lb0qPs6cYvnjb8S+0uHSsrir2abS5y2Gx6LO3nCM2m3t2HZNK9a6yPPB14Me/kkJWElMqmSe6lcyXFTXt4+8pbfgzEmJJNbTH1PD34+PaPtrnSsv3aPizT1UuBt2csxnH3WeMvl6bIIAc0ggASCABIIMdStGns3vki2ONyusRlMFS4jHZH1n8jXqVpVNj2LkjFk9Di6Oe8xknUlPtMpkjJGT0McZjNRKxhdOTe9GTIFkvsY+qfNE9VHi2y5BExgJRW5InJALJTkEAkTknJUAHGL3pEOlB80TknJFkorCmoSymXyRkCST0JLUqk6MsweVxTKZGTnnhjnNVDp0q0Kscxe3iuKLnKjJxkpReGuJvUbhVMRlsn9Tyefprx+Z6GYAGZAAAAAAAEASQAAAAAAAAAAAAAAAAAAAAQAAlIcy4nrV59zwdM5l7HUrt8JLJr6SyZpiiZKZjTLJnqzJLIWTMaZKZf2Lsm1lq3bj70SqZVKUbmnJLO1LYeV1XT2XvxTvxp1AAYVAAEACJSUVlvCNKtXc3iOyP1O/Dw5ct8ehkrXGcxhu5mtkgg9fj4seOaxSnJAB0AAgJSCCSQAAAAgCQQAJBAAkgAAMkAjYkkrkkgWCbTynhrcypJGUlmqh0qFVVYZ4rY0ZDmUqjpzUl5rmdGMlKKktqZ43Pw3jy/4hIAOAAAAAAAAAAAAAAAAAAAAAAAAAAAAACQObpF/rY9yOkcy89a4mvIthl25SpjVTLJmNMk9fHIZky6ZhjItrHaZJZMk6xi1idYZWWIdC3r63qTfrcHzNg5EZ4kmntW46lOaqQUlxPI6jj7buIXI3EmpcVdZ6kXs4s58XFeTLUFK9XrHhdlfMwliD3OPjmGPbEqgllWTfCQEArtCSARkbFgRkknaQEAkSCABIIAEggAACCBJAIItEggEbFiSuSckixntaupLUfZl8ma+Qc+XjnJj21DrA17Wtrx1Jdpbu9GweNnhcL21AACgAAAAAAAAAAAAAAAAAAAAAAAAAAIDHOhSm8ygm+ZkAS4t7SVC4aimoyWUYUzq39rK4jB09VTi+PI5k7W5p9qlJr+nabOLmkmqlGScmLWw8STTXBk6xqnJL6GTI1mUyMk9wvrM6FhWz6je/cc1GSjNwnseCmePfNUdS5rY9SL28WayQW3aSaODjnHjqCrIJIZo2lDKsllJMraAMbltJUkzltCwyRkjJGxfJJTJOS8qVgQCwkEACQQAJIAAEAjJXYnJBDZGStokZIyMjYnJZMpkJjYyZJyUTJTLbGSMnGSlF4aOlSmqlNSXmctHQs/Y+bMPWYzUqKzgA85AAAAAAAAAAAAAAAAAAAAACAAAAAAAAAAAczS1vrRVeK2x2S8DlRbPTyipRcZLKaw0eeuqDtrh028renzR1wySoi6KIsjXjUrEkIk7DbozzEyPcadKWrI287Drhl4EMhsNmOUi/cEpGKUhKRRs55ZA2Uc8PKEpGJvJm5OTXobUKmsuTLZMVSOpOOOMIv5IspZL8fJ3TyLplsmNMsmd5RfIK5JyXlSsCASAIAEggjI2JyVbDZXJS0S2QAV2AAAAjJI2JTLoxoui0GRHQs/YeZzkdK09gjL1nxiKzAA81AAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAAADT0lbddQc4r14bV3o3ATLpLzKLo2NIW/U3DlFepPavHkayNuF3BdElUWO8SGxTnmBrloSwy0uhmlIxSlkiUslWybkDZSTDZjkzhnnoQ3kglJt4Sy+SNinYXFTdTcfvbDLb+jLex1Z0HjGaUTCjd0pDVjQfFJxfyNJHfhvgSWTKkmmCyZOSpJ0lStkkqTktsSCCMjYlsq2GyCLQAIKAG0t4Mc9xTLLtiE9YnuJTbMMTKjljncvYsixVFjvALIqSi8SyI6Vn+7rxZzEdOy/d14sy9X8Yis4APOQAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAAAAAAYbqiq9CUOO9eJwmnGTi1hp4aPRmpcWFOtNzy4ye/G47cefb7S5CJNqpo+tDbHE13bysLKvP7Gqu94Nc5Mde0sAN+GjX/EqeUUbELGhH7Lk/wCplcufGejbj73hJt8kZo2lxU3Uml/VsO1GEYLEYqK5JYJOGXPb6Rty4aKk/aVUu6KNmno62hvi5v8AqZtg43K32KwhCmsQjGK7lgsAVGjpWObeMuUjmROxpGOtZz5rD+ZyI7jZ0/oSADWkJIJLQSSQCyUkEgkVBLIKgQSQQIMdTsmUpPczjy+kMUTKjFHeZUcuIWRYqixqgBAFkro6ll+7R8X9TlI6tn+6w8/qZur+ERWcAHnIAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAMVzHWtqq/pZxUd2o8U5vuZwka+m+0wBINqUEgEpCSCSwAAkCCSCAIJIK0CstxYqznnPCGHiZEWt6XXVHDi4trxKxM3Ffoq6LIqiyNmIAMFkpR1rL91h5/VnIR17L91h5/VmXqvhEVnAB56AAAAAAAAAAAAAAAAAAAASAIBIA//9k="
  }

  beforeEach(async function () {
    // Get signers
    [owner, collector1, collector2] = await ethers.getSigners();

    // Deploy the contract
    const SkyBudsMetadataFactory = await ethers.getContractFactory("SkyBudsMetadata");
    skyBudsMetadata = await SkyBudsMetadataFactory.deploy();
    const skyBudsMetaAddress = await skyBudsMetadata.getAddress()
    // Deploy the contract
    const SkyBudsFactory = await ethers.getContractFactory("SkyBuds");
    skyBuds = await SkyBudsFactory.deploy(skyBudsMetaAddress);
    const skyBudsAddress_ = await skyBuds.getAddress()
    skybudsAddress = skyBudsAddress_
    skyBuds.connect(owner);
    skyBudsMetadata.connect(owner);
    await skyBudsMetadata.transferOwnership(skyBudsAddress_);
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await skyBuds.owner()).to.equal(owner.address);
    });
    it("Should set the right owner of skyBudsMetadata", async function () {
      expect(await skyBudsMetadata.owner()).to.equal(skybudsAddress);
    });

    it("Should set the correct name and symbol", async function () {
      expect(await skyBuds.name()).to.equal("SkyBuds");
      expect(await skyBuds.symbol()).to.equal("SKB");
    });

        it("Should have the same address for metadata and skyBuds", async function () {
            const metaAddress = await skyBudsMetadata.getAddress();
            const configuredMetaAddress = await skyBuds.contractSkybudsMetadata();
            
            expect(metaAddress).to.equal(configuredMetaAddress);
        })

  });

  describe("Minting", function () {

    it("Should increment the token ID after minting", async function () {
      await skyBuds.mint(mockMetadata.wearables,mockMetadata.laziness,mockMetadata.speed,mockMetadata.isTalkative,mockMetadata.color,mockMetadata.imageUri);
      await skyBuds.mint(mockMetadata.wearables,mockMetadata.laziness,mockMetadata.speed,0,mockMetadata.color,mockMetadata.imageUri);
      
      // First token (ID 0) should be owned by collector1
      expect(await skyBuds.ownerOf(1)).to.equal(owner.address);
      
      // Second token (ID 1) should be owned by collector2
      expect(await skyBuds.ownerOf(2)).to.equal(owner.address);
    });

    it("Should emit Transfer event on successful mint", async function () {
      await expect(skyBuds.mint(mockMetadata.wearables,mockMetadata.laziness,mockMetadata.speed,mockMetadata.isTalkative,mockMetadata.color,mockMetadata.imageUri)
    ).to.emit(skyBuds, "Transfer")
        .withArgs(ethers.ZeroAddress, owner.address, 1);
    });

        it("Should emit a MetadataUpdated event on successful mint", async function () {
                const encoded = encodeMetadata(
          mockMetadata.wearables,mockMetadata.isTalkative?true:false,mockMetadata.speed,mockMetadata.laziness,mockMetadata.color)

            await expect(skyBuds.mint(mockMetadata.wearables,mockMetadata.laziness,mockMetadata.speed,mockMetadata.isTalkative,mockMetadata.color,mockMetadata.imageUri)
          ).to.emit(skyBudsMetadata, "MetadataUpdated")
              .withArgs(1, encoded,mockMetadata.imageUri);

       });

    it("Should fail when minting with bad wearables", async function () {
      await expect(
      skyBuds.mint([...mockMetadata.wearables,...mockMetadata.wearables,...mockMetadata.wearables],mockMetadata.laziness,mockMetadata.speed,mockMetadata.isTalkative,mockMetadata.color,mockMetadata.imageUri)
      ).to.be.revertedWith("Too many wearables");
    });

    it("Should fail when minting with speed out of range or laziness out of range", async function () {
      await expect(
skyBuds.mint(mockMetadata.wearables,mockMetadata.laziness,150,mockMetadata.isTalkative,mockMetadata.color,mockMetadata.imageUri)
      ).to.be.revertedWith("Speed out of range");

            await expect(
skyBuds.mint(mockMetadata.wearables,150,mockMetadata.speed,mockMetadata.isTalkative,mockMetadata.color,mockMetadata.imageUri)
      ).to.be.revertedWith("Laziness out of range");
    });


    it("Wearables maxed out should work", async function () { 
      await skyBuds.mint(Array(10).fill(1000),70,mockMetadata.speed,mockMetadata.isTalkative,mockMetadata.color,mockMetadata.imageUri)
        const exists = await skyBudsMetadata.tokenDataExists(1);
       
        expect(exists).to.equal(true);
    });

      it("All inputs maxed out should work", async function () {
      await skyBuds.mint(Array(10).fill(1000),100,100,1,mockMetadata.color,mockMetadata.imageUri)
        const exists = await skyBudsMetadata.tokenDataExists(1);
       
        expect(exists).to.equal(true);
    });

      it("Empty wearable array should work", async function () {
      await skyBuds.mint([],50,10,1,mockMetadata.color,mockMetadata.imageUri)
        const exists = await skyBudsMetadata.tokenDataExists(1);
       
        expect(exists).to.equal(true);
    });



    it("Wearables out of range should not work", async function () {
      let wearables = Array(10).fill(1000)
      wearables[0] = 1001 
      await skyBuds.mint(Array(10).fill(1000),70,mockMetadata.speed,mockMetadata.isTalkative,mockMetadata.color,mockMetadata.imageUri)
            await expect(
skyBuds.mint(wearables,70,mockMetadata.speed,mockMetadata.isTalkative,mockMetadata.color,mockMetadata.imageUri)
      ).to.be.revertedWith("Wearable ID out of range");
    });

    it("update wearables of non existant token should fail", async function () {
            await expect(
skyBuds.updateWearables(2,[1,2,3])
      ).to.be.revertedWith("Wearable update for nonexistent token");
    });
  });


  describe("Token URI", function () {

    it("Token should exist after minting", async function () {

      await skyBuds.mint(mockMetadata.wearables,mockMetadata.laziness,mockMetadata.speed,mockMetadata.isTalkative,mockMetadata.color,mockMetadata.imageUri);
        // Verify the token exists in both contracts
        const supply = await skyBuds.totalSupply();
        expect(supply).to.equal(1);

        const exists = await skyBudsMetadata.tokenDataExists(1);
        console.log("Token exists in metadata contract:", exists);
        expect(exists).to.equal(true);
    })

    it("Sould be able to get speed,laziness,color and isTalkative from Metadata", async function () {
      await skyBuds.mint(mockMetadata.wearables,mockMetadata.laziness,mockMetadata.speed,mockMetadata.isTalkative,mockMetadata.color,mockMetadata.imageUri);
      const metadata = await skyBudsMetadata.getEncodedMetadata(1);
      console.log("Encoded metadata:", metadata);
      const decoded = decodeMetadata(metadata);
      expect(decoded.speed).to.equal(mockMetadata.speed);
      expect(decoded.laziness).to.equal(mockMetadata.laziness);
      expect(decoded.color).to.equal(mockMetadata.color);


      const speed = await skyBudsMetadata.getSpeed(1);
      expect(speed).to.equal(mockMetadata.speed);
      const laziness = await skyBudsMetadata.getLaziness(1);
      expect(laziness).to.equal(mockMetadata.laziness);

      const color2 = await skyBudsMetadata.getColorHex(1);
      expect(color2.toLowerCase()).to.equal(mockMetadata.color.toLowerCase());
    })


    it("Should get tokenURI of minted token", async function () {

      await skyBuds.mint(mockMetadata.wearables,mockMetadata.laziness,mockMetadata.speed,mockMetadata.isTalkative,mockMetadata.color,mockMetadata.imageUri);

      const tokenURI = await skyBuds.tokenURI(1);

      const expectedTokenURI ={
          name: "SkyBud #1",
          description: "my little dude",
          image: 'data:image/jpg;base64,'+mockMetadata.imageUri,
          attributes: [
            { trait_type: "Talkative", value: mockMetadata.isTalkative },
            { trait_type: "Laziness", value: mockMetadata.laziness },
            { trait_type: "Speed", value: mockMetadata.speed },
            { trait_type: "Color", value: mockMetadata.color }
          ],
        }
      
        const trimmed = tokenURI.replace("data:application/json;base64,", "");
      const converted = Buffer.from(trimmed, "base64").toString("utf-8");
      const parsed = JSON.parse(converted);

      expect(parsed.name).to.equal(expectedTokenURI.name);
      expect(parsed.description).to.equal(expectedTokenURI.description);
      expect(parsed.image).to.equal(expectedTokenURI.image);
      const talkative = parsed.attributes.find(
        (attr:any) => attr.trait_type === "Talkative"
      );
      const laziness = parsed.attributes.find(
        (attr:any) => attr.trait_type === "Laziness"
      );
      const speed = parsed.attributes.find(
        (attr:any) => attr.trait_type === "Speed"
      );
      const color = parsed.attributes.find(
        (attr:any) => attr.trait_type === "Color"
      );
      expect(talkative.value).to.equal(mockMetadata.isTalkative?true:false);
      expect(laziness.value).to.equal(mockMetadata.laziness);
      expect(speed.value).to.equal(mockMetadata.speed);
      expect(color.value.toLowerCase()).to.equal(mockMetadata.color.toLowerCase());
      
    });

    it("Should fail to get token URI for non-existent token", async function () {
      const nonExistentTokenId = 999;
      
      await expect(
        skyBuds.tokenURI(nonExistentTokenId)
      ).to.be.revertedWith(
        "URI query for nonexistent token"
      );
    });
  });

  describe("Ownership", function () {
    it("Should allow only owner to transfer ownership", async function () {
      await skyBuds.transferOwnership(collector1.address);
      expect(await skyBuds.owner()).to.equal(collector1.address);
    });

    it("Should fail when non-owner tries to transfer ownership", async function () {
      await expect(
        skyBuds.connect(collector1).transferOwnership(collector2.address)
      ).to.be.revertedWithCustomError(
        skyBuds,
        "OwnableUnauthorizedAccount"
      );
    });
  });
});