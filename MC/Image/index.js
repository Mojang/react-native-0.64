


var React = require('react');
var View = require('../../Libraries/Components/View/View');
var Image = require('../../Libraries/Image/Image');
var StyleSheet = require('../../Libraries/StyleSheet/StyleSheet');
const ViewPropTypes = require('../../Libraries/DeprecatedPropTypes/DeprecatedViewPropTypes');
const NativeModules = require('../../Libraries/BatchedBridge/NativeModules');
const requireNativeComponent = require('../../Libraries/ReactNative/requireNativeComponent');
var PropTypes = require('prop-types');
var resolveAssetSource = require('../../Libraries/Image/resolveAssetSource');
const Platform = require('../../Libraries/Utilities/Platform');

const FastImageViewNativeModule = NativeModules.FastImageView
let disableFastImage = false

const useLocalImage = (source, style) => {
  if (Platform.OS === 'android') {
    // 安卓全部使用glide容易触发闪退
    return true
  }
  if (style && style.tintColor) {
    return true
  }
  // No source.
  if (disableFastImage) return true
  // No uri.
  if (!isLocalImage(source)) {
    if (!source.uri || !source.uri.startsWith('http')) {
      return true
    }
  }
  return false
}

const isLocalImage = source => {
  if (typeof source === 'object') {
    return false
  }
  return true
}

class FastImage extends React.Component {
    constructor (props) {
      super()
      this.state = {
        loaded: !props.showLoadingImg,
        loadError: false,
      }
    }
    setNativeProps(nativeProps) {
        this._root.setNativeProps(nativeProps)
    }

    captureRef = e => (this._root = e)

    onLoadEnd = () => {
      const { onLoadEnd } = this.props
      onLoadEnd && onLoadEnd()
      this.setState({
        loaded: true,
      })
    }

    onError = (e) => {
      const { onError } = this.props
      onError && onError(e)
      this.setState({
        loadError: true,
      })
    }

    render() {
        const {
            source,
            onLoadStart,
            onProgress,
            onLoad,
            onError,
            onLoadEnd,
            style,
            children,
            defaultImg,
            ...props
        } = this.props

        // If there's no source or source uri just fallback to Image.
        if (useLocalImage(source, style)) {
            return (
                <Image
                    ref={this.captureRef}
                    {...props}
                    style={style}
                    source={source}
                    onLoadStart={onLoadStart}
                    onProgress={onProgress}
                    onLoad={onLoad}
                    onError={onError}
                    onLoadEnd={onLoadEnd}
                />
            )
        }

        const resolvedSource = resolveAssetSource(source)
        if (!resolvedSource || this.state.loadError) {
          return (
            <View style={[style, styles.imageContainer, !isLocalImage(source) && { backgroundColor: '#e2e4e8' }]} ref={this.captureRef}>
              <Image style={styles.errorImg} resizeMode="contain" source={defaultImg || require('./img01.png')} />
            </View>
          )
        }

        return (
            <View style={[style, styles.imageContainer, !isLocalImage(source) && !this.state.loaded ? { backgroundColor: '#e2e4e8' } : null]} ref={this.captureRef}>
                <FastImageView
                    {...props}
                    style={StyleSheet.absoluteFill}
                    source={resolvedSource}
                    onFastImageLoadStart={onLoadStart}
                    onFastImageProgress={onProgress}
                    onFastImageLoad={onLoad}
                    onFastImageError={this.onError}
                    onFastImageLoadEnd={this.onLoadEnd}
                />
                {children && (
                    <View style={StyleSheet.absoluteFill}>{children}</View>
                )}
            </View>
        )
    }
}

const styles = StyleSheet.create({
    imageContainer: {
        overflow: 'hidden',
    },
    errorImg: {
      height: '100%',
      alignSelf: 'center',
    },
})

FastImage.resizeMode = {
    contain: 'contain',
    cover: 'cover',
    stretch: 'stretch',
    center: 'center',
}

FastImage.priority = {
    low: 'low',
    normal: 'normal',
    high: 'high',
}

FastImage.preload = sources => {
    FastImageViewNativeModule.preload(sources)
}

FastImage.defaultProps = {
    resizeMode: FastImage.resizeMode.cover,
    showLoadingImg: true, // 是否需要显示默认图
}

const FastImageSourcePropType = PropTypes.shape({
    uri: PropTypes.string,
    headers: PropTypes.objectOf(PropTypes.string),
    priority: PropTypes.oneOf(Object.keys(FastImage.priority)),
})

FastImage.propTypes = {
    source: PropTypes.oneOfType([FastImageSourcePropType, PropTypes.number]),
    onLoadStart: PropTypes.func,
    onProgress: PropTypes.func,
    onLoad: PropTypes.func,
    onError: PropTypes.func,
    onLoadEnd: PropTypes.func,
}



const FastImageView = requireNativeComponent('FastImageView', FastImage, {
    nativeOnly: {
        onFastImageLoadStart: true,
        onFastImageProgress: true,
        onFastImageLoad: true,
        onFastImageError: true,
        onFastImageLoadEnd: true,
    },
})


const FinalImage = FastImage


/**
 * 需要补充Image中的静态方法
 */
const { getSize, getSizeWithHeaders, prefetch, abortPrefetch, queryCache } = Image
FinalImage.getSize = getSize;
FinalImage.getSizeWithHeaders = getSizeWithHeaders;
FinalImage.prefetch = prefetch;
FinalImage.abortPrefetch = abortPrefetch;
FinalImage.queryCache = queryCache;
FinalImage.resolveAssetSource = resolveAssetSource;
FinalImage.disableFastImage = (b) => {
  disableFastImage = b
};

module.exports = FinalImage
